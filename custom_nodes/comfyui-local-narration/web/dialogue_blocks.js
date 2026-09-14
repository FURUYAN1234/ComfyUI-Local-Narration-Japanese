import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";
const editors=new Map();
function state(node){const w=node.widgets.find(w=>w.name==='dialogue_blocks');try{const d=JSON.parse(w.value);if(Array.isArray(d.blocks))return d;}catch{}return {blocks:[{id:crypto.randomUUID(),text:node.widgets.find(w=>w.name==='text')?.value||''}],target:''};}
function save(node,d){node.widgets.find(w=>w.name==='dialogue_blocks').value=JSON.stringify(d);app.graph.setDirtyCanvas(true,true);}
function show(node){
 if(editors.has(node.id)){editors.get(node.id).dialog.focus();return;}
 let data=state(node),deleted=null;save(node,data);
 const dialog=document.createElement('dialog');Object.assign(dialog.style,{width:'min(850px,90vw)',height:'85vh',boxSizing:'border-box',padding:'14px',background:'#20242c',color:'white',border:'1px solid #64748b',borderRadius:'12px',zIndex:9999});
 const add=(tag,text,parent=dialog)=>{const e=document.createElement(tag);e.textContent=text||'';parent.append(e);return e;};
 const heading=add('h2','Dialogue blocks / 手動の台詞ブロック');Object.assign(heading.style,{fontSize:'18px',margin:'0 0 6px'});
 const help=add('p','＋で追加・－で削除。声設定は共通。ブロック利用中は通常の原稿欄を使いません。 / Shared voice; blocks replace script.');Object.assign(help.style,{fontSize:'12px',margin:'4px 0 8px'});
 const list=add('div');Object.assign(list.style,{overflowY:'auto',flex:'1',minHeight:0});
 const status=add('p');status.setAttribute('role','status');Object.assign(status.style,{color:'#fbbf24',fontSize:'12px',margin:'6px 0',maxHeight:'32px',overflow:'auto'});
 const footer=add('div');Object.assign(footer.style,{display:'flex',flexWrap:'wrap',gap:'10px'});
 const results=()=>node.properties.dialogue_results||{};
 const button=(name,fn,parent)=>{const b=add('button',name,parent);b.type='button';Object.assign(b.style,{padding:'6px',fontSize:'12px'});b.onclick=fn;return b;};
 async function run(target){
  if(node.widgets.find(w=>w.name==='mode').value!=='手動'){status.textContent='ノードの設定方法を「手動」にしてください。';return;}
  if(data.blocks.some(b=>(!target||b.id===target)&&!b.text.trim())){status.textContent='空の台詞を入力するか、－で削除してください。';return;}
  try{const q=await (await api.fetchApi('/queue')).json();if(q.queue_running?.length||q.queue_pending?.length){status.textContent='実行中の処理が終わってから生成してください。';return;}
   data.target=target;save(node,data);await app.queuePrompt(0,1);status.textContent=target?'この台詞を生成キューへ送りました。読み確認窓で確認してください。':'全台詞を生成キューへ送りました。読み確認窓で確認してください。';
  }catch(e){status.textContent=e.message;}finally{data.target='';save(node,data);}
 }
 function render(){list.replaceChildren();data.blocks.forEach((b,i)=>{
  const section=add('section','',list);Object.assign(section.style,{padding:'12px',marginBottom:'12px',background:'#111827',borderRadius:'8px'});
  const header=add('div','',section);header.style.display='flex';header.style.justifyContent='space-between';add('strong',String(i+1).padStart(3,'0')+' / 台詞',header);
  const minus=button('− 削除 / Remove',()=>{deleted={block:b,index:i};data.blocks.splice(i,1);save(node,data);render();},header);minus.disabled=data.blocks.length<=1;
  const text=add('textarea','',section);text.value=b.text;text.setAttribute('aria-label','台詞ブロック'+(i+1));Object.assign(text.style,{width:'100%',boxSizing:'border-box',minHeight:'85px',fontSize:'16px',margin:'10px 0'});
  const out=add('div','',section);
  const renderAudio=()=>{out.replaceChildren();const result=results()[b.id];if(!result){add('p','未生成 / Not generated',out);return;}
   add('p',result.text===b.text?'生成済み / Generated':'原稿を変更しました。下は変更前の音声です。 / Previous text audio',out);
   const url=api.apiURL('/view?'+new URLSearchParams({filename:result.filename,subfolder:result.subfolder,type:'output'}));
   const audio=add('audio','',out);audio.controls=true;audio.preload='none';audio.src=url;Object.assign(audio.style,{width:'100%',height:'54px',minHeight:'54px',display:'block',marginBottom:'10px'});
   const a=add('a','↓ MP3保存 / Download MP3 — '+result.filename,out);a.href=url;a.download=result.filename;Object.assign(a.style,{display:'block',padding:'10px',background:'#166534',color:'white',borderRadius:'5px'});
  };renderAudio();text.oninput=()=>{b.text=text.value;save(node,data);renderAudio();};
  button('Generate this block / この台詞だけ生成',()=>run(b.id),section);
 });undo.disabled=!deleted;}
 button('＋ 台詞を追加 / Add',()=>{if(data.blocks.length>=100){status.textContent='最大100ブロックです。';return;}data.blocks.push({id:crypto.randomUUID(),text:''});save(node,data);render();list.lastElementChild.querySelector('textarea').focus();list.lastElementChild.scrollIntoView({block:'nearest'});},footer);
 const undo=button('削除を戻す / Undo remove',()=>{if(!deleted)return;data.blocks.splice(deleted.index,0,deleted.block);deleted=null;save(node,data);render();},footer);
 button('Close / 閉じる',()=>{dialog.close();dialog.remove();editors.delete(node.id);},footer);
 button('Generate all / 全台詞を生成',()=>run(''),footer);
 dialog.addEventListener('cancel',()=>{dialog.remove();editors.delete(node.id);});
 editors.set(node.id,{dialog,render,status});document.body.append(dialog);dialog.showModal();Object.assign(dialog.style,{display:'flex',flexDirection:'column'});render();
}
function result(item){const node=app.graph.getNodeById(item.direction_id);if(!node)return;node.properties.dialogue_results??={};node.properties.dialogue_results[item.id]=item;const editor=editors.get(node.id);editor?.render();if(editor)editor.status.textContent='✅ '+String(item.index).padStart(3,'0')+' 生成完了 / Generated';}
app.registerExtension({name:'LocalNarration.DialogueBlocks',nodeCreated(node){
 if(node.comfyClass==='LocalNarrationGenerate'){const old=node.onExecuted;node.onExecuted=function(data){old?.apply(this,arguments);for(const item of data.dialogue_blocks||[])result(item);};}
 if(node.comfyClass!=='LocalNarrationDirection')return;
 const w=node.widgets.find(w=>w.name==='dialogue_blocks');if(!w)return;w.hidden=true;w.computeSize=()=>[0,-4];if(w.inputEl)w.inputEl.style.display='none';
 const b=node.addWidget('button','Dialogue blocks / 台詞ブロックを編集',null,()=>show(node),{serialize:false});
 const update=()=>{const manual=node.widgets.find(w=>w.name==='mode')?.value==='手動';b.disabled=!manual;const script=node.widgets.find(w=>w.name==='text');const active=manual&&!!w.value;script.disabled=active;if(script.inputEl){script.inputEl.disabled=active;script.inputEl.style.opacity=active?'.45':'1';}};
 const draw=node.onDrawForeground;node.onDrawForeground=function(){update();return draw?.apply(this,arguments);};queueMicrotask(update);
 }});
api.addEventListener('local_narration.block_complete',e=>result(e.detail));
