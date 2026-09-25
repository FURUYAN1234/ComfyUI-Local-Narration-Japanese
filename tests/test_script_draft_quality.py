import importlib.util,json,tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
source=Path(__file__).parents[1]/'custom_nodes/comfyui-local-narration/runtime/planner.py'
spec=importlib.util.spec_from_file_location('planner',source)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as temp:
 m.ROOT=Path(temp);(m.ROOT/'config.json').write_text('{"llm_model":"test"}')
 bodies=[];calls=[];answers=[]
 def api(base,path,body=None,**kw):
  if body is None:return {}
  bodies.append(json.loads(json.dumps(body)))
  return {'choices':[{'finish_reason':'stop','message':{'content':json.dumps({'sentences':answers.pop(0)})}}]}
 lm=SimpleNamespace(endpoint=lambda:'http://local',api=api,model=lambda *_:None,load_model=lambda *a,**k:calls.append(('load',*a)),unload_model=lambda *a,**k:calls.append(('unload',*a)))
 loader=SimpleNamespace(loader=SimpleNamespace(exec_module=lambda m:None))
 with patch.object(m.importlib.util,'spec_from_file_location',return_value=loader),patch.object(m.importlib.util,'module_from_spec',return_value=lm):
  answers[:]=[['テラフォーマーについて考えます。'],['話題を紹介します。','背景を説明します。','具体例を挙げます。','問題を考えます。','考察をまとめます。']]
  answers.append(answers[-1]);result=m.propose('古い一文。','テラフォーマーについて考える。',42,lambda _:None,'script')
  assert len(result['text'].splitlines())==5 and len(bodies)==3
  assert bodies[0]['response_format']['json_schema']['schema']['properties']['sentences']['minItems']==5
  assert '検証に失敗' in bodies[1]['messages'][-1]['content']
  assert calls[-1][0]=='unload'
  answers[:]=[['明示した一文です。']]
  answers.append(answers[-1]);result=m.propose('古い一文。','紹介を1文で作って',42,lambda _:None,'script')
  assert len(result['text'].splitlines())==1
  assert bodies[-1]['response_format']['json_schema']['schema']['properties']['sentences']['minItems']==1
  answers[:]=[['一文目を直します。','二文目を直します。']]
  answers.append(answers[-1]);result=m.propose('元の一文目です。元の二文目です。','原稿を丁寧な口調に言い換えて',42,lambda _:None,'script')
  assert len(result['text'].splitlines())==2
  start=len(bodies);answers[:]=[['短いです。'],['まだ短いです。']]
  try:m.propose('','新しい紹介原稿を作って',42,lambda _:None,'script');raise AssertionError('short output accepted')
  except ValueError:pass
  assert len(bodies)-start==2 and calls[-1][0]=='unload'
print('PASS default complete 5-sentence draft, one bounded repair plus editorial pass, explicit 1 sentence, edit preserves count, failed repair releases model')
