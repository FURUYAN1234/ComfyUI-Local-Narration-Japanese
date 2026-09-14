import importlib.util,json,subprocess,time,uuid
from pathlib import Path
from datetime import datetime
import numpy as np
import soundfile as sf
import torch
import folder_paths
import comfy.model_management as mm
from server import PromptServer
from .reading_review import review

LOCAL=Path(__file__).with_name('local_config.json')
ROOT=Path(json.loads(LOCAL.read_text())['runtime']) if LOCAL.exists() else Path(__file__).with_name('runtime')
MODES=['AIおまかせ','手動','AI提案＋手動上書き']
ENGINES=['おまかせ','Irodori','Qwen']
VOICES=['デザイン','用意された声（Qwen）','参照音声']
CHARACTERS={'自由指定':'','落ち着いた女性ナレーター':'落ち着いた成人女性。聞き取りやすい標準語で丁寧な解説。','明るい女性ナレーター':'明るく親しみやすい成人女性。自然で軽快な案内。','落ち着いた男性ナレーター':'落ち着いた成人男性。低めの声で丁寧な説明。','元気な男性ナレーター':'元気で親しみやすい成人男性。軽快な口調。','やさしい物語の語り手':'柔らかい成人の声。穏やかなテンポで物語を語る。','元気なアニメキャラクター':'表情豊かで元気な若い成人女性のキャラクター声。','クールなアニメキャラクター':'若い成人男性の落ち着いたキャラクター声。控えめでクールな口調。','落ち着いたニュース調':'成人の中性的な声。明瞭で抑揚を抑えたニュース調。'}
SPEAKERS=['Ono_anna','Aiden','Dylan','Eric','Ryan','Serena','Sohee','Uncle_fu','Vivian']
def notify(node,state,text):
 PromptServer.instance.send_sync('local_narration.status',{'node':str(node),'state':state,'text':text})
def load_planner():
 spec=importlib.util.spec_from_file_location('local_narration_planner',ROOT/'planner.py')
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

class NarrationDirection:
 @classmethod
 def INPUT_TYPES(cls):
  return {'required':{
   'text':('STRING',{'multiline':True,'default':'日本語で、作りたい動画を伝えるだけ。声と映像で、アイデアを届けます。','tooltip':'読み上げる原稿。AIは本文を書き換えません。'}),
   'purpose':('STRING',{'multiline':True,'default':'ワークフローの紹介動画。聞き取りやすく親しみのある解説。'}),
   'mode':(MODES,),
   'engine':(ENGINES,{'default':'おまかせ'}),
   'voice_mode':(VOICES,),
   'speaker':(SPEAKERS,),
   'style':('STRING',{'multiline':True,'default':'','tooltip':'手動では声質・口調。AI提案＋手動上書きでは空欄ならAIの設定を使用。'}),
   'speed':('FLOAT',{'default':0,'min':0,'max':2,'step':0.05,'tooltip':'0=AI/標準。0.5〜2.0倍。音程を維持して調整。'}),
   'seed':('INT',{'default':42,'min':0,'max':2147483647}),
   'character':(list(CHARACTERS),{'default':'自由指定'}),
   'reference_text':('STRING',{'multiline':True,'default':'','tooltip':'参照音声で話している原稿。Qwenでは入力推奨。'}),
  },'optional':{'reference_audio':('AUDIO',)},'hidden':{'unique_id':'UNIQUE_ID'}}
 RETURN_TYPES=('NARRATION_PLAN','STRING')
 RETURN_NAMES=('Voice plan / 音声企画','Chosen settings / 選定内容')
 FUNCTION='plan';CATEGORY='audio/Local Narration'
 def plan(self,text,purpose,mode,engine,voice_mode,speaker,style,speed,seed,reference_text,reference_audio=None,unique_id=None,character="自由指定"):
  if mode not in MODES or engine not in ENGINES or voice_mode not in VOICES or speaker not in SPEAKERS:raise ValueError('設定の選択値が不正です。')
  if character not in CHARACTERS:raise ValueError('声キャラの選択値が不正です。')
  if mode!='AIおまかせ' and CHARACTERS[character]:style=CHARACTERS[character]+(' 追加指定：'+style.strip() if style.strip() else '')
  if not text.strip():raise ValueError('読み上げ原稿を入力してください。')
  if speed and not .5<=speed<=2:raise ValueError('話速は0（おまかせ）、または0.5〜2.0倍です。')
  try:
   if mode=='手動':
    p={'engine':'Irodori' if engine=='おまかせ' else engine,'style':style.strip() or '自然で聞き取りやすい日本語のナレーション。','speed':speed or 1.0,'reason':'手動設定'}
   else:
    mm.unload_all_models();mm.soft_empty_cache()
    p=load_planner().propose(text,purpose,seed,lambda msg:notify(unique_id,'running',msg))
    if mode=='AI提案＋手動上書き':
     if engine!='おまかせ':p['engine']=engine
     if style.strip():p['style']=style.strip()
     if speed:p['speed']=speed
   chosen='design' if mode=='AIおまかせ' else dict(zip(VOICES,['design','preset','reference']))[voice_mode]
   if chosen=='preset' and p['engine']!='Qwen':raise ValueError('用意された話者はQwen専用です。Qwenを選ぶかデザインを使用してください。')
   if chosen=='reference' and reference_audio is None:raise ValueError('参照音声モードでは音声を接続してください。')
   p.update(text=text,voice_mode=chosen,speaker=speaker,reference_text=reference_text,selection_mode=mode,character="AI選定："+p["style"] if mode=="AIおまかせ" else character)
   shown=json.dumps(p,ensure_ascii=False,indent=2)
   if chosen=='reference':p['_reference_audio']=reference_audio
   notify(unique_id,'complete','音声企画完了 / '+p['engine'])
   return (p,shown)
  except Exception:
   notify(unique_id,'error','音声企画エラー / 実行結果を確認');raise

class NarrationGenerate:
 @classmethod
 def INPUT_TYPES(cls):
  return {'required':{
   'plan':('NARRATION_PLAN',),
   'seed':('INT',{'default':42,'min':0,'max':2147483647}),
   'pitch_semitones':('FLOAT',{'default':0,'min':-6,'max':6,'step':.5,'tooltip':'音程。0で元の声。±12が1オクターブ。'}),
   'volume_db':('FLOAT',{'default':0,'min':-20,'max':6,'step':1}),
   'pause_ms':('INT',{'default':250,'min':0,'max':3000,'step':50,'tooltip':'長文を分割した区間の間。ミリ秒。'}),
   'irodori_steps':('INT',{'default':40,'min':1,'max':100}),
   'irodori_text_strength':('FLOAT',{'default':3,'min':0,'max':10,'step':.1}),
   'irodori_style_strength':('FLOAT',{'default':3,'min':0,'max':10,'step':.1}),
   'irodori_voice_strength':('FLOAT',{'default':5,'min':0,'max':10,'step':.1}),
   'irodori_duration_scale':('FLOAT',{'default':1,'min':.5,'max':2,'step':.05,'tooltip':'Irodoriが予測する発話時間の倍率。共通の話速とは別。'}),
   'qwen_temperature':('FLOAT',{'default':.9,'min':.1,'max':2,'step':.05}),
   'qwen_top_p':('FLOAT',{'default':.8,'min':.05,'max':1,'step':.05}),
   'qwen_top_k':('INT',{'default':50,'min':1,'max':100}),
   'qwen_repetition_penalty':('FLOAT',{'default':1.05,'min':1,'max':2,'step':.05}),
   'review_readings':('BOOLEAN',{'default':True,'label_on':'生成前に読み確認','label_off':'原稿を直接生成'}),
  },'hidden':{'unique_id':'UNIQUE_ID'}}
 RETURN_TYPES=('AUDIO','STRING');RETURN_NAMES=('Narration / 音声','Files and settings / 保存先・設定')
 FUNCTION='generate';CATEGORY='audio/Local Narration'
 @classmethod
 def IS_CHANGED(cls,**kwargs):return float("nan")
 def generate(self,plan,unique_id=None,review_readings=True,**options):
  p=dict(plan);reference=p.pop('_reference_audio',None)
  if review_readings:
   notify(unique_id,'running','台詞と読みの確認待ち / Review readings')
   p=review(p,unique_id)
  if p['engine'] not in ['Irodori','Qwen']:raise ValueError('音声モデルが不正です。')
  stamp=datetime.now().strftime('%Y%m%d%H%M%S')+'_'+uuid.uuid4().hex[:6]
  out=Path(folder_paths.get_output_directory())/'audio/LocalNarration'/stamp
  out.mkdir(parents=True,exist_ok=False)
  if reference is not None:
   audio=reference['waveform'][0].detach().cpu().numpy().T
   sf.write(out/'reference.wav',audio,reference['sample_rate']);p['reference']=str(out/'reference.wav')
  request={'plan':p,'options':options,'output':str(out)}
  (out/'request.json').write_text(json.dumps(request,ensure_ascii=False,indent=2))
  config=json.loads((ROOT/'config.json').read_text());python=config['python'][p['engine']]
  mm.unload_all_models();mm.soft_empty_cache()
  notify(unique_id,'running',p['engine']+' 音声生成中 / GPU')
  proc=None
  try:
   with (out/'generation.log').open('w') as log:
    proc=subprocess.Popen([python,'-u',str(ROOT/'worker.py'),str(out/'request.json')],stdout=log,stderr=subprocess.STDOUT)
    started=time.monotonic()
    while proc.poll() is None:
     mm.throw_exception_if_processing_interrupted()
     if time.monotonic()-started>1800:raise TimeoutError('音声生成が30分を超えました。ログを確認してください。')
     time.sleep(.2)
    if proc.returncode:raise RuntimeError('音声生成失敗: '+(out/'generation.log').read_text(errors='replace')[-1500:])
   audio,sr=sf.read(out/'audio.wav',dtype='float32',always_2d=True)
   report=json.loads((out/'result.json').read_text())
   notify(unique_id,'complete','音声生成完了 / '+str(round(report['seconds'],1))+'秒')
   return ({'waveform':torch.from_numpy(audio.T.copy()).unsqueeze(0),'sample_rate':sr},json.dumps(report,ensure_ascii=False,indent=2))
  except Exception:
   if proc is not None and proc.poll() is None:
    proc.terminate()
    try:proc.wait(timeout=10)
    except subprocess.TimeoutExpired:proc.kill();proc.wait()
   notify(unique_id,'error','音声生成停止 / 保存先のログを確認');raise

NODE_CLASS_MAPPINGS={'LocalNarrationDirection':NarrationDirection,'LocalNarrationGenerate':NarrationGenerate}
NODE_DISPLAY_NAME_MAPPINGS={'LocalNarrationDirection':'Voice direction / 日本語おまかせ・手動設定','LocalNarrationGenerate':'Generate speech / 音声生成・詳細設定'}
WEB_DIRECTORY='./web'

import asyncio
from aiohttp import web
_download_lock=asyncio.Lock()
@PromptServer.instance.routes.post('/local-narration/download-models')
async def download_models(request):
 if request.headers.get('Origin') and request.headers['Origin'].split('://',1)[-1]!=request.host:return web.json_response({'error':'Cross-origin request rejected'},status=403)
 if _download_lock.locked():return web.json_response({'error':'モデル取得は実行中です。'},status=409)
 if not (ROOT/'config.json').exists():return web.json_response({'error':'READMEの初回セットアップを実行してください。'},status=400)
 async with _download_lock:
  body=await request.json();node=str(body.get('node',''))
  c=json.loads((ROOT/'config.json').read_text())
  child=await asyncio.create_subprocess_exec(c['python']['Irodori'],'-u',str(ROOT/'download_models.py'),stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.STDOUT)
  lines=[]
  while line:=await child.stdout.readline():
   message=line.decode(errors='replace').strip();lines.append(message)
   if message.startswith(('Download','Ready','All models')):notify(node,'running',message)
  code=await child.wait()
  if code:notify(node,'error','モデル取得失敗 / Retry');return web.json_response({'error':'\n'.join(lines[-15:])},status=500)
  notify(node,'complete','モデル取得完了 / Models ready');return web.json_response({'ok':True})
