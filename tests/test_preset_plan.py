import ast,json
from pathlib import Path
from types import SimpleNamespace
p=Path(__file__).resolve().parents[1]/'custom_nodes/comfyui-local-narration/__init__.py'
tree=ast.parse(p.read_text()); keep=[]
for n in tree.body:
 if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in ['MODES','ENGINES','VOICES','CHARACTERS','SPEAKERS'] for t in n.targets):keep.append(n)
 if isinstance(n,ast.FunctionDef) and n.name=='parse_blocks':keep.append(n)
 if isinstance(n,ast.ClassDef) and n.name=='NarrationDirection':keep.append(n)
calls=[]
import re
import threading
ctx={'json':json,'re':re,'_planner_lock':threading.Lock(),'notify':lambda *a:None,'mm':SimpleNamespace(unload_all_models=lambda:None,soft_empty_cache=lambda:None),'load_planner':lambda:SimpleNamespace(propose=lambda *a:(calls.append(a) or {'engine':'Irodori','style':'AIの声','speed':1.0,'reason':'test'}))}
exec(compile(ast.Module(body=keep,type_ignores=[]),'direction-test','exec'),ctx)
args=dict(text='台詞を保持。',purpose='用途',mode='手動',engine='Qwen',voice_mode='デザイン',speaker='Ono_anna',style='明るく軽快な口調で話す。',speed=1.1,seed=42,reference_text='',character='自由指定')
p,_=ctx['NarrationDirection']().plan(**args);assert not calls and p['engine']=='Qwen' and p['style']==args['style']
args['mode']='AI提案＋手動上書き';p,_=ctx['NarrationDirection']().plan(**args);assert p['style']==args['style'] and p['speed']==1.1 and p['text']==args['text']
args['mode']='AIおまかせ'
try:ctx['NarrationDirection']().plan(**args);raise AssertionError('Unadopted AI settings executed')
except ValueError as e:assert '未確定' in str(e)
assert not calls,'Run must never silently re-plan adopted settings'
for mode in ['手動','AI提案＋手動上書き']:
 args.update(mode=mode,dialogue_blocks=json.dumps({'blocks':[{'id':str(i),'text':f'{i}文目です。'} for i in range(1,6)]}))
 p,_=ctx['NarrationDirection']().plan(**args)
 assert len(p['dialogue_blocks'])==5 and p['text']=='\n'.join(b['text'] for b in p['dialogue_blocks'])
args['speed']=0.1
try:ctx['NarrationDirection']().plan(**args);raise AssertionError('Invalid speed allowed')
except ValueError:pass
print('PASS actual direction method: adopted/manual settings, unadopted rejection, no re-planning, five-block preservation, invalid speed')

