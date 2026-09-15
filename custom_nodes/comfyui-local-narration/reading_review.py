import json,re,uuid,threading,subprocess,time,os,tempfile
from pathlib import Path
from aiohttp import web
import comfy.model_management as mm
from server import PromptServer
LOCAL=Path(__file__).with_name('local_config.json')
ROOT=Path(json.loads(LOCAL.read_text())['runtime']) if LOCAL.exists() else Path(__file__).with_name('runtime')
MEMORY=ROOT/'private'/'narration_readings.json'
LOCK=threading.RLock();SESSIONS={}
def load_memory():
 return json.loads(MEMORY.read_text()) if MEMORY.exists() else {}
def save_memory(data):
 MEMORY.parent.mkdir(parents=True,exist_ok=True)
 fd,path=tempfile.mkstemp(dir=MEMORY.parent,prefix='.readings-')
 try:
  with os.fdopen(fd,'w') as f:json.dump(data,f,ensure_ascii=False,indent=2);f.flush();os.fsync(f.fileno())
  os.replace(path,MEMORY)
 finally:
  if os.path.exists(path):os.unlink(path)
def split_rows(text):
 return [x.strip() for x in re.findall(r'[^。！？\n]+[。！？]?|[。！？]',text) if x.strip()]
def review(plan,node):
 rows=split_rows(plan['text'])
 memory=load_memory()
 raw=subprocess.run([json.loads((ROOT/'config.json').read_text())['python']['Irodori'],str(ROOT/'readings_helper.py')],input=json.dumps(rows,ensure_ascii=False),text=True,capture_output=True,timeout=30)
 if raw.returncode:raise RuntimeError('読み変換に失敗: '+raw.stderr[-500:])
 initial=json.loads(raw.stdout)
 initial=[memory.get(text,reading) for text,reading in zip(rows,initial)]
 rid=uuid.uuid4().hex
 payload={'request_id':rid,'rows':rows,'readings':initial,'engine':plan['engine'],'remembered':memory,'node':str(node)}
 s={'payload':payload,'event':threading.Event(),'result':None,'client_id':PromptServer.instance.client_id}
 with LOCK:SESSIONS[rid]=s
 server=PromptServer.instance;server.send_sync('local_narration.reading_review',payload,server.client_id)
 try:
  deadline=time.monotonic()+1800
  while not s['event'].wait(.25):
   mm.throw_exception_if_processing_interrupted()
   if time.monotonic()>deadline:raise RuntimeError('読み確認が30分以内に完了しなかったため中止しました。')
  mm.throw_exception_if_processing_interrupted()
  if s['result'].get('cancelled'):raise mm.InterruptProcessingException()
  p=dict(plan);p['original_text']=plan['text'];p['text']='\n'.join(s['result']['readings']);p['reading_review']={'rows':rows,'readings':s['result']['readings']}
  return p
 finally:
  with LOCK:SESSIONS.pop(rid,None)
@PromptServer.instance.routes.get('/local-narration/reading-review/pending')
async def pending(request):
 client_id=request.query.get('client_id')
 with LOCK:items=[s['payload'] for s in SESSIONS.values() if client_id and s.get('client_id')==client_id and s['result'] is None]
 return web.json_response({'pending':items},headers={'Cache-Control':'no-store'})
@PromptServer.instance.routes.post('/local-narration/reading-review/submit')
async def submit(request):
 if request.headers.get('Origin') and request.headers['Origin'].split('://',1)[-1]!=request.host:return web.json_response({'error':'Cross-origin request rejected'},status=403)
 body=await request.json()
 with LOCK:
  s=SESSIONS.get(body.get('request_id'))
  if not s or s['result'] is not None:return web.json_response({'error':'確認は終了済みです。'},status=409)
  if body.get('cancelled'):s['result']={'cancelled':True};s['event'].set();return web.json_response({'ok':True})
  readings=body.get('readings')
  if not isinstance(readings,list) or len(readings)!=len(s['payload']['rows']):return web.json_response({'error':'原稿と読みの文数が一致しません。'},status=400)
  for line in readings:
   if not isinstance(line,str) or not line.strip() or len(line)>4000 or re.search(r'[A-Za-z0-9\u3400-\u9fff々\r\n]',line):return web.json_response({'error':'空欄・漢字・英数字・改行がある読みを修正してください。'},status=400)
  if body.get('remember'):
   memory=load_memory()
   for original,initial,new in zip(s['payload']['rows'],s['payload']['readings'],readings):
    if initial!=new:memory[original]=new
   save_memory(memory)
  s['result']={'readings':readings};s['event'].set()
 return web.json_response({'ok':True})
