import ast,types
from pathlib import Path
source=Path(__file__).parents[1]/'custom_nodes/comfyui-local-narration/__init__.py'
tree=ast.parse(source.read_text())
fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='notify')
sent=[]
server=types.SimpleNamespace(client_id='initiator',send_sync=lambda *args:sent.append(args))
ns={'PromptServer':types.SimpleNamespace(instance=server)}
exec(compile(ast.Module(body=[fn],type_ignores=[]),str(source),'exec'),ns)
for state,terminal in [('running',False),('complete',True),('error',True)]:
 ns['notify']('4',state,'message',terminal=terminal)
assert all(len(a)==3 and a[2]=='initiator' for a in sent)
assert sent[1][1]['terminal'] is True
ns['notify']('3','running','download',client_id='downloader')
assert sent[-1][2]=='downloader'
count=len(sent);server.client_id=None
ns['notify']('4','complete','headless',terminal=True)
ns['notify']('4','running','missing downloader',client_id=None)
assert len(sent)==count, 'missing recipient must not broadcast to other workflows'
print('PASS status, terminal, errors target initiator; downloads target requester; missing recipient never broadcasts')
