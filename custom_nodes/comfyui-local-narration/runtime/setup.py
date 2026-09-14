from pathlib import Path
import sys,subprocess,json,argparse,shutil
r=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--irodori-python');p.add_argument('--qwen-python');p.add_argument('--download',action='store_true');a=p.parse_args()
if not shutil.which('ffmpeg') or not shutil.which('git'):raise SystemExit('Install ffmpeg and git first / ffmpegとgitを先に導入してください。')
if sys.version_info<(3,10):raise SystemExit('Python 3.10 or later is required')
def run(args):subprocess.run([str(x) for x in args],check=True)
def env(name,existing):
 if existing:return str(Path(existing).absolute())
 path=r/'envs'/name;python=path/'bin/python'
 if not python.exists():run([sys.executable,'-m','venv',path])
 run([python,'-m','pip','install','--upgrade','pip'])
 run([python,'-m','pip','install','torch==2.8.0','torchaudio==2.8.0','--index-url','https://download.pytorch.org/whl/cu128'])
 common=['numpy==2.2.6','soundfile==0.13.1','librosa==0.11.0','scipy==1.15.3','einops','PyYAML','sentencepiece','accelerate==1.12.0','safetensors','packaging','tqdm']
 run([python,'-m','pip','install',*common])
 if name=='irodori':
  run([python,'-m','pip','install','transformers==5.12.1','pykakasi==2.3.0','torchdata==0.11.0','descript-audiotools==0.7.2','torch-stoi','peft','gradio','datasets','wandb','pyaml','Flask'])
  run([python,'-m','pip','install','--no-deps','git+https://github.com/facebookresearch/dacvae@414c20785fc3a28373073ea8ef7a1316eeeaca6e','git+https://github.com/SesameAILabs/silentcipher.git@d46d7d0893a583d8968ab3a6626e2289faec9152','git+https://github.com/Aratako/Irodori-TTS@89f9d8fbd4d51ea019867ee1197725ede1df13c5'])
 else:run([python,'-m','pip','install','qwen-tts==0.1.1','transformers==4.57.3'])
 return str(python)
python={'Irodori':env('irodori',a.irodori_python),'Qwen':env('qwen',a.qwen_python)}
for kind,exe in python.items():
 module='from irodori_tts.inference_runtime import InferenceRuntime;import pykakasi' if kind=='Irodori' else 'from qwen_tts import Qwen3TTSModel'
 run([exe,'-c',"import os;os.environ.update(USE_TF='0',USE_FLAX='0');"+module+";import torch;assert torch.cuda.is_available(),'CUDA GPU unavailable'"])
c=json.loads((r/'config.json').read_text()) if (r/'config.json').exists() else {}
c.update(version='1.0.0',python=python,llm_model=c.get('llm_model','qwen/qwen3.5-9b'))
(r/'config.json').write_text(json.dumps(c,indent=2))
if a.download:run([python['Irodori'],r/'download_models.py'])
print('Environments ready. Use Download models in the workflow. / 環境準備完了。ワークフローのモデル取得ボタンを使用できます。')
