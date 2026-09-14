import importlib.util,json,tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('planner',Path(__file__).resolve().parents[1]/'custom_nodes/comfyui-local-narration/runtime/planner.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as temp:
 module.ROOT=Path(temp);(module.ROOT/'config.json').write_text('{"llm_model":"test"}')
 calls=[];answer={'text':'低めの成人の声で、穏やかに説明する。'}
 def api(base,path,body=None,**kw):
  if body is None:return {}
  assert json.loads(body['messages'][1]['content'])=={'相談内容':'落ち着いた声にしたい'}
  assert '元の台詞' not in body['messages'][1]['content']
  return {'choices':[{'finish_reason':'stop','message':{'content':json.dumps(answer,ensure_ascii=False)}}]}
 lm=SimpleNamespace(endpoint=lambda:'http://local',api=api,cli=lambda *a,**k:(calls.append(a) or '[]'))
 loader=SimpleNamespace(loader=SimpleNamespace(exec_module=lambda m:None))
 with patch.object(module.importlib.util,'spec_from_file_location',return_value=loader),patch.object(module.importlib.util,'module_from_spec',return_value=lm):
  assert module.propose('元の台詞','落ち着いた声にしたい',42,lambda _:None,'style')==answer
  answer['text']='元の台詞'
  try:module.propose('元の台詞','落ち着いた声にしたい',42,lambda _:None,'style');raise AssertionError('script echo accepted')
  except ValueError:pass
  assert calls[-1][0]=='unload'
print('PASS consultation sends brief only; rejects script echo; unloads on invalid result')

