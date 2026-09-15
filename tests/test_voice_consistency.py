import ast,json
from pathlib import Path

p=Path(__file__).resolve().parents[1]/'custom_nodes/comfyui-local-narration/__init__.py'
tree=ast.parse(p.read_text())
keep=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in {'requires_voice_anchor','apply_voice_anchor','retain_voice_anchor'}]
ctx={'json':json}
exec(compile(ast.Module(body=keep,type_ignores=[]),'voice-consistency-test','exec'),ctx)

needs=ctx['requires_voice_anchor']; apply=ctx['apply_voice_anchor']; retain=ctx['retain_voice_anchor']
assert needs({'engine':'Irodori','voice_mode':'design'})
assert needs({'engine':'Qwen','voice_mode':'design'})
assert not needs({'engine':'Qwen','voice_mode':'preset'})
assert not needs({'engine':'Qwen','voice_mode':'design','_reference_audio':object()})
for engine in ('Irodori','Qwen'):
 anchored=apply({'engine':engine,'voice_mode':'design','style':'落ち着いた声'},'/tmp/first.wav','一文目です。')
 assert anchored['reference']=='/tmp/first.wav'
 if engine=='Qwen':
  assert anchored['voice_mode']=='reference' and anchored['reference_text']=='一文目です。'
 else: assert anchored['voice_mode']=='design'
assert apply({'engine':'Qwen','voice_mode':'design'},None,'')['voice_mode']=='design'
plan={'engine':'Qwen','voice_mode':'design'}
anchor,text=retain(plan,None,'',json.dumps({'audio':'/tmp/first.wav'}),'一文目です。')
assert (anchor,text)==('/tmp/first.wav','一文目です。')
second=apply(plan,anchor,text)
assert second['voice_mode']=='reference' and second['reference']=='/tmp/first.wav' and second['reference_text']=='一文目です。'
assert retain(plan,anchor,text,json.dumps({'audio':'/tmp/second.wav'}),'二文目です。')==(anchor,text)
print('PASS voice consistency: design voice anchors after the first dialogue block; preset and explicit reference stay unchanged')
