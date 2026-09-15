import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";
app.registerExtension({name:'LocalNarration.FinalPlayback',nodeCreated(node){if(node.comfyClass!=='LocalNarrationPlayback')return;
 const root=document.createElement('div');Object.assign(root.style,{background:'#17241d',color:'white',padding:'10px',overflowY:'auto',height:'100%',minHeight:0,boxSizing:'border-box'});
 let state='saved',banner;
 const timestamp=()=>(()=>{
  const filename=node.properties.completed_audio?.completed_audio?.[0]?.filename||'';
  const m=filename.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  return m?m[1]+'/'+m[2]+'/'+m[3]+' '+m[4]+':'+m[5]+':'+m[6]:node.properties.narration_completed_at||'日時不明';
 })();
 const update=()=>{
  if(!banner)return;
  const has=!!node.properties.completed_audio?.completed_audio?.length;
  const labels={running:'⏳ Generating / 今回の音声を生成中',complete:'✅ Complete / 今回の生成完了',cancelled:'↩ Cancelled / 今回の生成はキャンセル',error:'⚠ Failed / 今回の生成は失敗',saved:'Saved result / 保存済みの生成結果'};
  banner.textContent=labels[state]+(state==='running'||state==='cancelled'||state==='error'?(has?'\n↓ 下の音声は前回の結果です（'+timestamp()+'）':'\n今回の音声はまだありません'):has?'\n生成日時 / Generated: '+timestamp():'\n音声はまだありません');
  Object.assign(banner.style,{position:'sticky',top:'-10px',zIndex:1,display:'block',padding:'12px',whiteSpace:'pre-line',fontWeight:'bold',background:state==='complete'?'#166534':state==='running'?'#614600':state==='error'?'#742a2a':'#294454',border:'2px solid #91ac9a',marginBottom:'12px'});
 };
 const upstream=()=>node.inputs?.some(input=>String(app.graph?.links?.[input.link]?.origin_id)===String(currentNode));
 let currentNode;
 const listen=(event,handler)=>{api.addEventListener(event,handler);listeners.push([event,handler]);};
 const listeners=[];
 listen('executing',e=>{currentNode=e.detail;if(currentNode!=null&&(String(currentNode)===String(node.id)||upstream())){state='running';update();}});
 listen('local_narration.status',e=>{currentNode=e.detail?.node;if(!upstream())return;const s=e.detail.state;if(s==='running'||s==='cancelled'||s==='error'){state=s;update();}});
 const removed=node.onRemoved;node.onRemoved=function(){for(const [e,h] of listeners)api.removeEventListener(e,h);removed?.apply(this,arguments);};
 const render=data=>{
  root.replaceChildren();banner=document.createElement('div');root.append(banner);update();
  if(!data){const empty=document.createElement('p');root.append(empty);empty.textContent='After generation: full audio and sentence downloads / 生成後に全体音声と台詞別の再生・保存を表示';return;}
  const add=(tag,text,parent=root)=>{const e=document.createElement(tag);e.textContent=text||'';parent.append(e);return e;};
  add('strong','Audio results / 音声の再生・保存');
  const blocks=data.dialogue_blocks||[];
  add('p','Sentences / 台詞 '+blocks.length+'件 · Scroll to browse / スクロールして一覧を確認');
  const items=[...(data.completed_audio||[]),...blocks];
  for(const item of items){
   const s=add('section');s.style.margin='12px 0';
   add('div',item.index?String(item.index).padStart(3,'0')+' — '+item.text:item.text,s);
   const url=api.apiURL('/view?'+new URLSearchParams({filename:item.filename,subfolder:item.subfolder,type:'output'}));
   const a=add('audio','',s);a.controls=true;a.preload='none';a.src=url;Object.assign(a.style,{display:'block',width:'100%',height:'54px',minHeight:'54px',margin:'8px 0'});
   const link=add('a','↓ Save MP3 / MP3を保存',s);link.href=url;link.download=item.filename;Object.assign(link.style,{display:'block',padding:'10px',background:'#166534',color:'white'});
   const location=add('small','output/'+item.subfolder+'/'+item.filename,s);Object.assign(location.style,{display:'block',overflowWrap:'anywhere',marginTop:'4px'});
  }
 };
 node.addDOMWidget('completed_audio','narration_audio',root,{serialize:false,getMinHeight:()=>420});node.size[1]=Math.max(node.size[1],420);render(node.properties.completed_audio);
 const old=node.onExecuted;node.onExecuted=function(data){old?.apply(this,arguments);node.properties.completed_audio=data;node.properties.narration_completed_at=new Date().toLocaleString();state='complete';render(data);};
 const configure=node.onConfigure;node.onConfigure=function(){configure?.apply(this,arguments);state='saved';render(node.properties.completed_audio);};
}});
