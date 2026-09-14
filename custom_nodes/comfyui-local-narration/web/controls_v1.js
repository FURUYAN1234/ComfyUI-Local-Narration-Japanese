import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";
import {installDirectionEditor} from "./direction_editor.js";
const labels={character:"Character / 声のキャラクター",review_readings:"Reading review / 生成前に読み確認",text:"Script / 読み上げ原稿",purpose:"Purpose / 用途・おまかせ指示",mode:"Control / 設定方法",engine:"Model / 音声モデル",voice_mode:"Voice source / 声の作り方",speaker:"Speaker / 用意された話者",style:"Voice and tone / 声質・口調",speed:"Speed / 話速（0＝おまかせ）",reference_text:"Reference transcript / 参照音声の原稿",seed:"Seed / 候補番号",pitch_semitones:"Pitch / 音程（半音）",volume_db:"Volume / 音量（dB）",pause_ms:"Pause / 区間の間（ms）",irodori_steps:"Irodori steps / 生成ステップ",irodori_text_strength:"Irodori text / 原稿への強さ",irodori_style_strength:"Irodori style / 口調への強さ",irodori_voice_strength:"Irodori reference / 参照声への強さ",irodori_duration_scale:"Irodori duration / 予測尺の倍率",qwen_temperature:"Qwen temperature / 変化の大きさ",qwen_top_p:"Qwen top-p / 候補の累積確率",qwen_top_k:"Qwen top-k / 候補の数",qwen_repetition_penalty:"Qwen repetition / 反復抑制"};

app.registerExtension({name:"LocalNarration.Controls",nodeCreated(node){
 if(!node.comfyClass?.startsWith("LocalNarration"))return;
 for(const w of node.widgets||[])if(labels[w.name])w.label=labels[w.name];
 if(node.comfyClass==="LocalNarrationGenerate"){
 const approval=node.widgets.find(w=>w.name==='review_readings');if(approval){approval.value=true;approval.disabled=true;approval.label='Approval required / 生成前の読み承認（必須）';}
 node.addWidget('button','Download models / 必須モデル一式を取得',null,async()=>{try{const r=await api.fetchApi('/local-narration/download-models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({node:node.id})});const d=await r.json();if(!r.ok)throw Error(d.error);alert('モデル一式の準備ができました。');}catch(e){alert(e.message);}});
 }
 if(node.comfyClass==="LocalNarrationReference"){
  const upload=node.addWidget('button','Upload reference / 参照音声を選択・アップロード',null,()=>{const input=document.createElement('input');input.type='file';input.accept='audio/*';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const body=new FormData();body.append('image',file);body.append('type','input');body.append('overwrite','false');const r=await api.fetchApi('/upload/image',{method:'POST',body});const d=await r.json();if(!r.ok)throw Error(d.error||r.statusText);node.widgets.find(w=>w.name==='audio').value=(d.subfolder?d.subfolder+'/':'')+d.name;app.graph.setDirtyCanvas(true,true);}catch(e){node.title='⚠️ '+e.message;}};input.click();},{serialize:false});
  const draw=node.onDrawForeground;node.onDrawForeground=function(...args){const linked=(node.outputs?.[0]?.links||[]).map(id=>app.graph.links[id]).map(l=>app.graph.getNodeById(l?.target_id)).filter(Boolean);const ignored=linked.length>0&&linked.every(d=>d.widgets?.find(w=>w.name==='mode')?.value==='AIおまかせ');const on=!!node.widgets.find(w=>w.name==='enabled')?.value&&!ignored;
   for(const w of node.widgets||[]){const disabled=w.name==='enabled'?ignored:!on;if(w.inputEl){w.disabled=false;w.inputEl.disabled=disabled;w.inputEl.style.opacity=disabled?'.4':'1';}else w.disabled=disabled;}
   node.title=ignored?'Reference ignored in AI / AI時は参照不使用':on?'Reference ON / 参照音声を使用':'Reference OFF / 参照音声は不使用';node.color=on?'#34445b':'#333333';return draw?.apply(this,args);};
 }
 if(node.comfyClass==="LocalNarrationDirection"&&node.addDOMWidget){
 const sync=installDirectionEditor(node),draw=node.onDrawForeground;
 node.onDrawForeground=function(...args){sync();return draw?.apply(this,args);};
 const configure=node.onConfigure;node.onConfigure=function(...args){const result=configure?.apply(this,args);sync();return result;};
 }


}});
api.addEventListener("local_narration.status",({detail:d})=>{
 const node=app.graph.getNodeById(d.node);if(!node)return;
 if(node.comfyClass!=="LocalNarrationDirection")node.title=(d.state==="complete"?"✅ ":d.state==="error"?"⚠️ ":"⏳ ")+d.text;
 node.color=d.state==="complete"?"#254d35":d.state==="error"?"#653232":"#34445b";
 app.graph.setDirtyCanvas(true,true);
});
