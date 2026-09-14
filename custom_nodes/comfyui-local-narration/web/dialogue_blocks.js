import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";
const editors=new Map();
function sentences(text){return (text.match(/[^。！？\n]+[。！？]?|[。！？]/g)||[]).map(s=>s.trim()).filter(Boolean);}
export function scriptBlocks(text){return sentences(text).map(text=>({id:crypto.randomUUID(),text}));}
function normalize(data){return {blocks:data.blocks.flatMap(b=>{const lines=sentences(b.text);return (lines.length?lines:['']).map((text,i)=>({id:i?crypto.randomUUID():b.id,text}));}),target:''};}
function state(node){const w=node.widgets.find(w=>w.name==='dialogue_blocks');try{const d=JSON.parse(w.value);if(Array.isArray(d.blocks))return d;}catch{}return {blocks:[{id:crypto.randomUUID(),text:node.widgets.find(w=>w.name==='text')?.value||''}],target:''};}
export function saveScript(node,d){node.widgets.find(w=>w.name==='text').value=d.blocks.map(b=>b.text).join('\n');node.widgets.find(w=>w.name==='dialogue_blocks').value=JSON.stringify(d);app.graph.setDirtyCanvas(true,true);}
function show(node){
 if(editors.has(node.id)){editors.get(node.id).dialog.focus();return;}
 let data=normalize(state(node)),deleted=null;data.target='';
 const dialog=document.createElement('dialog');Object.assign(dialog.style,{width:'min(850px,90vw)',height:'min(650px,85vh)',boxSizing:'border-box',padding:'14px',background:'#20242c',color:'white',border:'1px solid #64748b',borderRadius:'12px',zIndex:9999});
 const add=(tag,text,parent=dialog)=>{const e=document.createElement(tag);e.textContent=text||'';parent.append(e);return e;};
 const heading=add('h2','Script sentences / 漢字交じりの原稿を1文ずつ入力');Object.assign(heading.style,{fontSize:'18px',margin:'0 0 6px'});
 const help=add('p','1枠に1文。＋／－で追加・削除し、入力後は戻って通常の「実行」を押します。生成直前に読みの承認窓が開きます。 / One sentence per field; Run after editing, then approve readings.');Object.assign(help.style,{fontSize:'12px',margin:'4px 0 8px'});
 const list=add('div');Object.assign(list.style,{overflowY:'auto',flex:'1',minHeight:0});
 const status=add('p');status.setAttribute('role','status');Object.assign(status.style,{color:'#fbbf24',fontSize:'12px',margin:'6px 0',maxHeight:'32px',overflow:'auto'});
 const footer=add('div');Object.assign(footer.style,{display:'flex',flexWrap:'wrap',gap:'10px'});
 
 const button=(name,fn,parent)=>{const b=add('button',name,parent);b.type='button';Object.assign(b.style,{padding:'6px',fontSize:'12px'});b.onclick=fn;return b;};
 function render(){list.replaceChildren();data.blocks.forEach((b,i)=>{
  const section=add('section','',list);Object.assign(section.style,{padding:'12px',marginBottom:'12px',background:'#111827',borderRadius:'8px'});
  const header=add('div','',section);header.style.display='flex';header.style.justifyContent='space-between';add('strong',String(i+1).padStart(3,'0')+' / 台詞',header);
  const minus=button('− 削除 / Remove',()=>{deleted={block:b,index:i};data.blocks.splice(i,1);render();},header);minus.disabled=data.blocks.length<=1;
  const text=add('textarea','',section);text.value=b.text;text.setAttribute('aria-label','台詞ブロック'+(i+1));Object.assign(text.style,{width:'100%',boxSizing:'border-box',minHeight:'85px',fontSize:'16px',margin:'10px 0'});
  text.oninput=()=>{b.text=text.value;data.target='';};
 });undo.disabled=!deleted;}
 button('＋ 台詞を追加 / Add',()=>{if(data.blocks.length>=100){status.textContent='最大100ブロックです。';return;}data.blocks.push({id:crypto.randomUUID(),text:''});render();list.lastElementChild.querySelector('textarea').focus();list.lastElementChild.scrollIntoView({block:'nearest'});},footer);
 const undo=button('削除を戻す / Undo remove',()=>{if(!deleted)return;data.blocks.splice(deleted.index,0,deleted.block);deleted=null;render();},footer);
 const close=()=>{dialog.close();dialog.remove();editors.delete(node.id);};
 button('Cancel and return / 変更を破棄して戻る',close,footer);
 button('Save and return / 入力を保存して戻る',()=>{if(data.blocks.some(b=>!b.text.trim())){status.textContent='空欄へ台詞を入力するか、－で削除してください。';return;}const normalized=normalize(data);if(normalized.blocks.length>100){status.textContent='最大100文です。';return;}if(normalized.blocks.length!==data.blocks.length){data=normalized;render();status.textContent='複数の文を1文ずつに分けました。内容を確認して、もう一度「戻る」を押してください。';return;}saveScript(node,data);close();},footer);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 editors.set(node.id,{dialog,render,status});document.body.append(dialog);dialog.showModal();Object.assign(dialog.style,{display:'flex',flexDirection:'column'});render();
}
app.registerExtension({name:'LocalNarration.DialogueBlocks',nodeCreated(node){
 if(node.comfyClass!=='LocalNarrationDirection')return;
 const w=node.widgets.find(w=>w.name==='dialogue_blocks');if(!w)return;w.hidden=true;w.computeSize=()=>[0,-4];if(w.inputEl)w.inputEl.style.display='none';
 node.narrationEditSentences=()=>show(node);
 // Kept as a hidden compatibility entry point for workflows/extensions.
 const b=node.addWidget('button','Script sentences / 台詞を1文ずつ入力・編集（＋／－）',null,()=>show(node),{serialize:false});
 b.hidden=true;b.computeSize=()=>[0,-4];
 }});
