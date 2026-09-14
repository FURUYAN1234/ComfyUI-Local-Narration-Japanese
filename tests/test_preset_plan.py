import ast,json
from pathlib import Path
from types import SimpleNamespace
p=Path(__file__).resolve().parents[1]/'custom_nodes/comfyui-local-narration/__init__.py'
tree=ast.parse(p.read_text()); keep=[]
for n in tree.body:
 if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in ['MODES','ENGINES','VOICES','CHARACTERS','SPEAKERS'] for t in n.targets):keep.append(n)
 if isinstance(n,ast.ClassDef) and n.name=='NarrationDirection':keep.append(n)
calls=[]
import threading
ctx={'json':json,'_planner_lock':threading.Lock(),'notify':lambda *a:None,'mm':SimpleNamespace(unload_all_models=lambda:None,soft_empty_cache=lambda:None),'load_planner':lambda:SimpleNamespace(propose=lambda *a:(calls.append(a) or {'engine':'Irodori','style':'AIの声','speed':1.0,'reason':'test'}))}
exec(compile(ast.Module(body=keep,type_ignores=[]),'direction-test','exec'),ctx)
args=dict(text='台詞を保持。',purpose='用途',mode='手動',engine='Qwen',voice_mode='デザイン',speaker='Ono_anna',style='明るく軽快な口調で話す。',speed=1.1,seed=42,reference_text='',character='自由指定')
p,_=ctx['NarrationDirection']().plan(**args);assert not calls and p['engine']=='Qwen' and p['style']==args['style']
args['mode']='AI提案＋手動上書き';p,_=ctx['NarrationDirection']().plan(**args);assert p['style']==args['style'] and p['speed']==1.1 and p['text']==args['text']
args['mode']='AIおまかせ';p,_=ctx['NarrationDirection']().plan(**args);assert p['style']=='AIの声' and p['engine']=='Irodori'
args['speed']=0.1
try:ctx['NarrationDirection']().plan(**args);raise AssertionError('Invalid speed allowed')
except ValueError:pass
print('PASS actual direction method: manual, override, automatic, script preservation, invalid speed')

