import importlib.util,json,tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('planner',Path(__file__).resolve().parents[1]/'custom_nodes/comfyui-local-narration/runtime/planner.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as temp:
 module.ROOT=Path(temp);(module.ROOT/'config.json').write_text('{"llm_model":"test"}')
 calls=[];expected={'相談内容':'落ち着いた声にしたい'};answer={'text':'低めの成人の声で、穏やかに説明する。'}
 def api(base,path,body=None,**kw):
  if body is None:return {}
  assert json.loads(body['messages'][1]['content'])==expected
  if '参考原稿' in expected:assert body['response_format']['json_schema']['schema']['properties']['sentences']['minItems']==5
  if '参考原稿' not in expected:assert '元の台詞' not in body['messages'][1]['content']
  return {'choices':[{'finish_reason':'stop','message':{'content':json.dumps(answer,ensure_ascii=False)}}]}
 lm=SimpleNamespace(endpoint=lambda:'http://local',api=api,cli=lambda *a,**k:(calls.append(a) or '[]'))
 loader=SimpleNamespace(loader=SimpleNamespace(exec_module=lambda m:None))
 with patch.object(module.importlib.util,'spec_from_file_location',return_value=loader),patch.object(module.importlib.util,'module_from_spec',return_value=lm):
  assert module.propose('元の台詞','落ち着いた声にしたい',42,lambda _:None,'style')==answer
  answer['text']='元の台詞'
  try:module.propose('元の台詞','落ち着いた声にしたい',42,lambda _:None,'style');raise AssertionError('script echo accepted')
  except ValueError:pass
  assert calls[-1][0]=='unload'
  expected={'相談内容':'台詞を5行作って、各文10文字程度','参考原稿':'元の台詞'}
  answer={'sentences':['一文目です。','二文目です。','三文目です。','四文目です。','五文目です。'],'engine':'Irodori','style':'穏やかな声','speed':1.0,'reason':'紹介向け'}
  result=module.propose('元の台詞','台詞を5行作って、各文10文字程度',42,lambda _:None,'compose')
  assert len(result['text'].splitlines())==5 and result['engine']=='Irodori'
  answer['sentences']=['一文だけ。']
  try:module.propose('元の台詞','台詞を5行作って、各文10文字程度',42,lambda _:None,'compose');raise AssertionError('Wrong sentence count accepted')
  except ValueError as e:assert '5文' in str(e)
  assert calls[-1][0]=='unload'

print('PASS consultation: brief-only instructions, echo rejection, compose sentence array, 5行 vs 10文字, wrong count rejection and cleanup')

