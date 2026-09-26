import json,re,uuid,threading,subprocess,time,os,tempfile
from pathlib import Path
from aiohttp import web
import comfy.model_management as mm
from server import PromptServer
LOCAL=Path(__file__).with_name('local_config.json')
ROOT=Path(json.loads(LOCAL.read_text())['runtime']) if LOCAL.exists() else Path(__file__).with_name('runtime')
MEMORY=ROOT/'private'/'narration_readings.json'
DICTIONARY=ROOT/'private'/'narration_dictionary.json'
LOCK=threading.RLock();SESSIONS={}
def load_memory():
 return json.loads(MEMORY.read_text()) if MEMORY.exists() else {}
def save_json(path,data):
 path.parent.mkdir(parents=True,exist_ok=True)
 fd,path_temp=tempfile.mkstemp(dir=path.parent,prefix='.readings-')
 try:
  with os.fdopen(fd,'w') as f:json.dump(data,f,ensure_ascii=False,indent=2);f.flush();os.fsync(f.fileno())
  os.replace(path_temp,path)
 finally:
  if os.path.exists(path_temp):os.unlink(path_temp)
def save_memory(data):save_json(MEMORY,data)
def load_dictionary():return json.loads(DICTIONARY.read_text()) if DICTIONARY.exists() else {}
def valid_dictionary_entry(word,reading):
 return isinstance(word,str) and 1<=len(word)<=80 and word.strip()==word and not re.search(r'[\r\n\t]',word) and isinstance(reading,str) and 1<=len(reading)<=200 and reading.strip()==reading and bool(re.fullmatch(r'[\u3041-\u3096\u309d\u309eー 　、。！？・]+',reading))
def convert_rows(rows,dictionary):
 raw=subprocess.run([json.loads((ROOT/'config.json').read_text())['python']['Irodori'],str(ROOT/'readings_helper.py')],input=json.dumps({'rows':rows,'dictionary':dictionary},ensure_ascii=False),text=True,capture_output=True,timeout=30)
 if raw.returncode:raise RuntimeError('読み変換に失敗: '+raw.stderr[-500:])
 return json.loads(raw.stdout)
def initial_readings(rows,memory,dictionary):
 converted=convert_rows(rows,dictionary)
 return [reading if any(term in text for term in dictionary) else memory.get(text,reading) for text,reading in zip(rows,converted)]
def split_rows(text):
 return [x.strip() for x in re.findall(r'[^。！？\n]+[。！？]?|[。！？]',text) if x.strip()]
def review(plan,node):
 rows=split_rows(plan['text'])
 memory=load_memory()
 dictionary=load_dictionary()
 initial=initial_readings(rows,memory,dictionary)
 rid=uuid.uuid4().hex
 payload={'request_id':rid,'rows':rows,'readings':initial,'engine':plan['engine'],'remembered':memory,'dictionary':dictionary,'node':str(node)}
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

def same_origin(request):
 return not request.headers.get('Origin') or request.headers['Origin'].split('://',1)[-1]==request.host
@PromptServer.instance.routes.get('/local-narration/reading-review/dictionary')
async def dictionary_get(request):
 return web.json_response({'dictionary':load_dictionary()},headers={'Cache-Control':'no-store'})
@PromptServer.instance.routes.post('/local-narration/reading-review/dictionary')
async def dictionary_post(request):
 if not same_origin(request):return web.json_response({'error':'Cross-origin request rejected'},status=403)
 body=await request.json()
 word=body.get('word');reading=body.get('reading');action=body.get('action')
 if not isinstance(word,str) or not 1<=len(word)<=80 or word.strip()!=word or re.search(r'[\r\n\t]',word):return web.json_response({'error':'単語を1〜80文字で入力してください。'},status=400)
 if action=='set' and not valid_dictionary_entry(word,reading):return web.json_response({'error':'読みはひらがなで1〜200文字入力してください。'},status=400)
 if action not in {'set','delete'}:return web.json_response({'error':'操作を確認してください。'},status=400)
 with LOCK:
  dictionary=load_dictionary()
  if action=='set':dictionary[word]=reading
  else:dictionary.pop(word,None)
  save_json(DICTIONARY,dictionary)
 return web.json_response({'dictionary':dictionary},headers={'Cache-Control':'no-store'})
@PromptServer.instance.routes.post('/local-narration/reading-review/preview')
async def dictionary_preview(request):
 if not same_origin(request):return web.json_response({'error':'Cross-origin request rejected'},status=403)
 body=await request.json();rows=body.get('rows')
 if not isinstance(rows,list) or len(rows)>100 or any(not isinstance(row,str) or len(row)>4000 for row in rows):return web.json_response({'error':'台詞を確認してください。'},status=400)
 dictionary=load_dictionary()
 return web.json_response({'readings':initial_readings(rows,load_memory(),dictionary),'dictionary':dictionary},headers={'Cache-Control':'no-store'})
