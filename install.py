from pathlib import Path
import argparse,shutil,subprocess,sys,wave
r=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--comfyui',type=Path,required=True);p.add_argument('--irodori-python');p.add_argument('--qwen-python');a=p.parse_args();root=a.comfyui.expanduser().resolve()
if not (root/'main.py').exists():raise SystemExit('ComfyUI main.py not found')
n=root/'custom_nodes/comfyui-local-narration'
if n.exists():raise SystemExit('Destination already exists. Back up the existing installation before updating. / 既存ノードがあります。退避してから更新してください。')
shutil.copytree(r/'custom_nodes/comfyui-local-narration',n)
folder=root/'user/default/workflows/03_音声/18_音声_ローカルナレーション';folder.mkdir(parents=True,exist_ok=True)
shutil.copy2(r/'workflows/LocalNarration_v1.0.0.json',folder/'日本語ナレーション_TTS切替_AI・手動.json')
reference=root/'input/local-narration-placeholder.wav';reference.parent.mkdir(exist_ok=True)
if not reference.exists():
 with wave.open(str(reference),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(24000);f.writeframes(bytes(48000))
args=[sys.executable,str(n/'runtime/setup.py')]
if a.irodori_python:args+=['--irodori-python',a.irodori_python]
if a.qwen_python:args+=['--qwen-python',a.qwen_python]
subprocess.run(args,check=True)
print('Restart ComfyUI, then use Download models. / ComfyUI再起動後、モデル取得ボタンを押してください。')
