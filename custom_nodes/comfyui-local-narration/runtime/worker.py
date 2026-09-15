from pathlib import Path
import os,sys,json,re,time,gc,subprocess
os.environ.update(USE_TF='0',USE_FLAX='0',HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1')
import numpy as np
import soundfile as sf
import torch
from audio_join import DEFAULT_PAUSE_MS,join_numpy_audio
r=Path(__file__).resolve().parent
config=json.loads((r/'config.json').read_text())
req=json.loads(Path(sys.argv[1]).read_text())
out=Path(req['output']);out.mkdir(parents=True,exist_ok=True)
p=req['plan'];opt=req['options'];torch.manual_seed(opt['seed'])
text=p['text'].strip()
if not text:raise ValueError('読み上げ原稿が空です。')
pieces=re.findall(r'[^。！？\n]+[。！？]?|[。！？]',text)
parts=[];buf=''
for piece in pieces:
 if len(buf+piece)>100 and buf:parts.append(buf);buf=''
 while len(piece)>150:parts.append(piece[:150]);piece=piece[150:]
 buf+=piece
if buf:parts.append(buf)
reference=p.get('reference');reference_text=p.get('reference_text','')
if p['voice_mode']=='reference' and not reference:raise ValueError('参照音声を接続してください。')
all_audio=[];reports=[];start=time.perf_counter()
if p['engine']=='Irodori':
 from irodori_tts.inference_runtime import InferenceRuntime,RuntimeKey,SamplingRequest
 model=InferenceRuntime.from_key(RuntimeKey(checkpoint=config['irodori_checkpoint'],model_device='cuda',model_precision='bf16',codec_device='cuda',codec_precision='fp32'))
 for i,part in enumerate(parts):
  result=model.synthesize(SamplingRequest(text=part,caption=p['style'],ref_wav=reference,no_ref=not bool(reference),seed=opt['seed']+i,num_steps=opt['irodori_steps'],cfg_scale_text=opt['irodori_text_strength'],cfg_scale_caption=opt['irodori_style_strength'],cfg_scale_speaker=opt['irodori_voice_strength'],duration_scale=opt['irodori_duration_scale']),log_fn=print)
  a=result.audio.detach().cpu().numpy().squeeze();sr=result.sample_rate
  chunk=out/f'part-{i:03}.wav';sf.write(chunk,a,sr)
  if not reference:reference=str(chunk)
  all_audio.append(a);reports.append({'text':part,'seconds':len(a)/sr})
else:
 from qwen_tts import Qwen3TTSModel
 mode=p['voice_mode'];kind={'design':'VoiceDesign','preset':'CustomVoice','reference':'Base'}[mode]
 def load(kind):return Qwen3TTSModel.from_pretrained(config['models']['Qwen/Qwen3-TTS-12Hz-1.7B-'+kind],device_map='cuda:0',dtype=torch.bfloat16,attn_implementation='sdpa')
 model=load(kind)
 generation=dict(max_new_tokens=4096,temperature=opt['qwen_temperature'],top_p=opt['qwen_top_p'],top_k=opt['qwen_top_k'],repetition_penalty=opt['qwen_repetition_penalty'])
 for i,part in enumerate(parts):
  if mode=='design':
   wavs,sr=model.generate_voice_design(text=part,language='Japanese',instruct=p['style'],**generation)
  elif mode=='preset':
   wavs,sr=model.generate_custom_voice(text=part,language='Japanese',speaker=p['speaker'],instruct=p['style'],**generation)
  else:
   wavs,sr=model.generate_voice_clone(text=part,language='Japanese',ref_audio=reference,ref_text=reference_text or None,x_vector_only_mode=not bool(reference_text),**generation)
  a=wavs[0];chunk=out/f'part-{i:03}.wav';sf.write(chunk,a,sr)
  all_audio.append(a);reports.append({'text':part,'seconds':len(a)/sr})
  if mode=='design' and len(parts)>1:
   reference=str(chunk);reference_text=part;mode='reference';del model;gc.collect();torch.cuda.empty_cache();model=load('Base')
sf.write(out/'raw.wav',join_numpy_audio(all_audio,sr,opt.get('pause_ms',DEFAULT_PAUSE_MS)),sr)
pitch=2**(opt['pitch_semitones']/12)
filters=[f'asetrate={sr}*{pitch}',f'aresample={sr}',f'atempo={p["speed"]/pitch}',f'volume={opt["volume_db"]}dB']
subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',str(out/'raw.wav'),'-af',','.join(filters),'-ar','48000','-ac','1',str(out/'audio.wav')],check=True)
report={'plan':p,'options':opt,'segments':reports,'seconds':sf.info(out/'audio.wav').duration,'generation_seconds':time.perf_counter()-start,'audio':str(out/'audio.wav')}
(out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'complete':str(out/'result.json')},ensure_ascii=False),flush=True)
