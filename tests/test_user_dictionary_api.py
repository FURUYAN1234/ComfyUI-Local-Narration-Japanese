import asyncio,importlib.util,json,sys,tempfile,types
from pathlib import Path
from aiohttp import web

root=Path(__file__).resolve().parents[1]/'custom_nodes/comfyui-local-narration'
comfy=types.ModuleType('comfy');model=types.ModuleType('comfy.model_management')
model.throw_exception_if_processing_interrupted=lambda:None
comfy.model_management=model
sys.modules['comfy']=comfy;sys.modules['comfy.model_management']=model
server=types.ModuleType('server')
class Routes:
 def get(self,path):return lambda fn:fn
 def post(self,path):return lambda fn:fn
server.PromptServer=types.SimpleNamespace(instance=types.SimpleNamespace(routes=Routes()))
sys.modules['server']=server
spec=importlib.util.spec_from_file_location('reading_review_test',root/'reading_review.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class Request:
 def __init__(self,data=None,origin='http://127.0.0.1:8188'):
  self.data=data or {};self.host='127.0.0.1:8188';self.headers={'Origin':origin};self.query={}
 async def json(self):return self.data
def decode(response):return json.loads(response.body)
async def test():
 with tempfile.TemporaryDirectory(dir='/home/furu/Codex/work/local-narration-gender-20260926') as temp:
  module.DICTIONARY=Path(temp)/'private/dictionary.json'
  module.MEMORY=Path(temp)/'private/sentences.json'
  module.convert_rows=lambda rows,dictionary:[dictionary.get('星雲','誤読')+'がひかる。' for _ in rows]
  response=await module.dictionary_post(Request({'action':'set','word':'星雲','reading':'せいうん'}))
  assert response.status==200 and decode(response)['dictionary']=={'星雲':'せいうん'}
  assert module.DICTIONARY.is_file()
  response=await module.dictionary_preview(Request({'rows':['星雲が光る。']}))
  assert response.status==200 and decode(response)['readings']==['せいうんがひかる。']
  assert (await module.dictionary_post(Request({'action':'set','word':'星雲','reading':'セイウン'}))).status==400
  assert (await module.dictionary_post(Request({'action':'set','word':'星雲','reading':'せいうん'},'http://other.example'))).status==403
  assert decode(await module.dictionary_get(Request()))['dictionary']=={'星雲':'せいうん'}
  response=await module.dictionary_post(Request({'action':'delete','word':'星雲'}))
  assert response.status==200 and decode(response)['dictionary']=={}
  assert (await module.dictionary_preview(Request({'rows':'wrong'}))).status==400
asyncio.run(test())
print('PASS dictionary API: save, preview, read, delete, invalid reading and cross-origin rejection')
