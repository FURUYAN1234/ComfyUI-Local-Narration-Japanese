import ast,json
from pathlib import Path
from types import SimpleNamespace
p=Path(__file__).resolve().parents[1]/'custom_nodes/comfyui-local-narration/__init__.py'
tree=ast.parse(p.read_text()); keep=[]
for n in tree.body:
 if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in ['MODES','GEMINI_ENGINES','ENGINES','VOICES','CHARACTERS','SPEAKERS','GEMINI_VOICES','GEMINI_VOICE_DESIGNS','GEMINI_EMOTIONS','GEMINI_EMOTION_STRENGTH'] for t in n.targets):keep.append(n)
 if isinstance(n,ast.FunctionDef) and n.name=='parse_blocks':keep.append(n)
 if isinstance(n,ast.ClassDef) and n.name=='NarrationDirection':keep.append(n)
calls=[]
import re
import threading
ctx={'json':json,'re':re,'_planner_lock':threading.Lock(),'notify':lambda *a:None,'mm':SimpleNamespace(InterruptProcessingException=type('InterruptProcessingException',(Exception,),{}),unload_all_models=lambda:None,soft_empty_cache=lambda:None),'load_planner':lambda:SimpleNamespace(propose=lambda *a:(calls.append(a) or {'engine':'Irodori','style':'AIの声','speed':1.0,'reason':'test'}))}
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
args.update(speed=1.0,mode='手動',engine='Gemini 3.8 Flash TTS',voice_mode='用意された声（Gemini）',character='自由指定',dialogue_blocks='',gemini_voice='Kore｜芯のある安定した声',gemini_emotion='喜び',gemini_emotion_strength='控えめ')
p,_=ctx['NarrationDirection']().plan(**args);assert p['gemini_model']=='gemini-3.8-flash-tts' and '嬉しさ' in p['gemini_style'] and '控えめ' in p['gemini_style']
args.update(engine='Gemini 3.8 Flash-Lite TTS',voice_mode='新しい声をデザイン（Gemini）',gemini_voice_design_preset='自由入力',gemini_voice_design='落ち着いた成人の中低音')
p,_=ctx['NarrationDirection']().plan(**args);assert p['gemini_model']=='gemini-3.8-flash-lite-tts' and p['gemini_voice_design']=='落ち着いた成人の中低音'
args.update(gemini_voice_design_preset='落ち着いた女性ドキュメンタリー',gemini_voice_design='')
p,_=ctx['NarrationDirection']().plan(**args);assert p['gemini_voice_design']==ctx['GEMINI_VOICE_DESIGNS']['落ち着いた女性ドキュメンタリー']
args.update(voice_mode='保存済みVoice ID（Gemini）',gemini_voice_id='invalid')
try:ctx['NarrationDirection']().plan(**args);raise AssertionError('Invalid Gemini Voice ID allowed')
except ValueError:pass
print('PASS actual direction method: local modes, Gemini Flash/Lite, preset/design/emotion, invalid Voice ID, legacy preservation')
