import ast
from pathlib import Path
from types import SimpleNamespace
tree=ast.parse((Path(__file__).resolve().parents[1]/'custom_nodes/comfyui-local-narration/__init__.py').read_text())
events=[]
def notify(*a,**kw):events.append((a,kw))
def fail(*a,**kw):raise RuntimeError('cancelled or failed')
generate=next(n for c in tree.body if isinstance(c,ast.ClassDef) and c.name=='NarrationGenerate' for n in c.body if isinstance(n,ast.FunctionDef) and n.name=='generate')
ctx={'notify':notify,'review':fail}
exec(compile(ast.Module(body=[generate],type_ignores=[]),'test','exec'),ctx)
for plan in [{},{'dialogue_blocks':[{}]}]:
 try:ctx['generate'](SimpleNamespace(generate_blocks=fail),plan,unique_id='3');raise AssertionError('failure swallowed')
 except RuntimeError:pass
 assert events[-1][0][1]=='error' and events[-1][1]['terminal'] is True
save=next(n for c in tree.body if isinstance(c,ast.ClassDef) and c.name=='NarrationPlayback' for n in c.body if isinstance(n,ast.FunctionDef) and n.name=='save')
exec(compile(ast.Module(body=[save],type_ignores=[]),'test','exec'),ctx)
try:ctx['save'](SimpleNamespace(_save=fail),{},'{}',unique_id='4');raise AssertionError('failure swallowed')
except RuntimeError:pass
assert events[-1][0][1]=='error' and events[-1][1]['terminal'] is True
print('PASS review cancellation, block failure, and save failure emit terminal error and preserve exception')
