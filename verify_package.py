from pathlib import Path
import argparse,hashlib,json,ast

def verify(root):
    root=Path(root)
    expected=json.loads((root/'SHA256SUMS.json').read_text())
    actual={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and p.relative_to(root).as_posix()!='SHA256SUMS.json'}
    if actual!=expected:
        raise ValueError('Missing, modified or extra files: '+str(sorted(set(actual)^set(expected)))+'; changed: '+str([p for p in expected.keys()&actual.keys() if expected[p]!=actual[p]]))
    for name in actual:
        p=Path(name)
        if p.name in ('config.json','local_config.json','narration_readings.json') or any(x in p.parts for x in ('.git','private','__pycache__','envs')):raise ValueError('Private/runtime file: '+name)
        if p.suffix=='.py':ast.parse((root/p).read_text())
    workflow=json.loads((root/('workflows/LocalNarration_v'+(root/'VERSION').read_text().strip()+'.json')).read_text())
    types={n['type'] for n in workflow['nodes']}
    assert {'LocalNarrationDirection','LocalNarrationGenerate','MarkdownNote','LocalNarrationPlayback','LocalNarrationReference'}<=types
    assert len(list((root/'workflows').glob('*.json')))==1
    assert workflow['extra']['local_narration_version']==(root/'VERSION').read_text().strip()
    print('PASS:',len(actual),'files; hashes, extras, privacy, syntax and workflow structure')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('folder',nargs='?',default=Path(__file__).parent);verify(p.parse_args().folder)
