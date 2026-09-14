from pathlib import Path
import json,os,tempfile
from huggingface_hub import snapshot_download
r=Path(__file__).resolve().parent
c=json.loads((r/'config.json').read_text())
models={}
for item in json.loads((r/'models.json').read_text()):
 print('Download / 取得確認: '+item['repo'],flush=True)
 models[item['repo']]=snapshot_download(item['repo'],revision=item['revision'],ignore_patterns=['*.bin','*.onnx','*.gguf'])
 print('Ready / 準備完了: '+item['repo'],flush=True)
c['models']=models;c['irodori_checkpoint']=str(Path(models['Aratako/Irodori-TTS-v4.1-Small'])/'model.safetensors')
fd,name=tempfile.mkstemp(dir=r,prefix='.config-')
with os.fdopen(fd,'w') as f:json.dump(c,f,ensure_ascii=False,indent=2);f.flush();os.fsync(f.fileno())
os.replace(name,r/'config.json')
print('All models ready / モデル一式の準備完了',flush=True)
