from pathlib import Path
import argparse,hashlib,json,zipfile
ROOT=Path(__file__).resolve().parent
ALLOWED=['README.md','LICENSE','VERSION','install.py','verify_package.py','workflows','custom_nodes','images']
EXCLUDE={'config.json','local_config.json','narration_readings.json','__pycache__','private','envs'}
def build(output):
    files={}
    for name in ALLOWED:
        item=ROOT/name
        if not item.exists():
            if name=='images':continue
            raise FileNotFoundError(item)
        for p in ([item] if item.is_file() else item.rglob('*')):
            rel=p.relative_to(ROOT)
            if not p.is_file() or any(x in EXCLUDE for x in rel.parts) or p.suffix=='.pyc':continue
            files[rel.as_posix()]=p.read_bytes()
    files['SHA256SUMS.json']=(json.dumps({n:hashlib.sha256(b).hexdigest() for n,b in sorted(files.items())},indent=2)+'\n').encode()
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for n,b in sorted(files.items()):
            info=zipfile.ZipInfo(n,date_time=(2020,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16;z.writestr(info,b)
    print(output)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('output');build(p.parse_args().output)
