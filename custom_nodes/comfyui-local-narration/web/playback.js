import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";
app.registerExtension({name:'LocalNarration.FinalPlayback',nodeCreated(node){if(node.comfyClass!=='LocalNarrationPlayback')return;
 const root=document.createElement('div');Object.assign(root.style,{background:'#17241d',color:'white',padding:'10px',overflowY:'auto',height:'420px',maxHeight:'420px',boxSizing:'border-box'});
 const render=data=>{
  root.replaceChildren();
  if(!data){root.textContent='After generation: full audio and sentence downloads / 生成後に全体音声と台詞別の再生・保存を表示';return;}
  const add=(tag,text,parent=root)=>{const e=document.createElement(tag);e.textContent=text||'';parent.append(e);return e;};
  add('strong','✅ Completed / 音声生成完了');
  add('p','Audio files are saved automatically. / 音声ファイルは自動保存済みです。下の保存ボタンでダウンロードできます。');
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
 const old=node.onExecuted;node.onExecuted=function(data){old?.apply(this,arguments);node.properties.completed_audio=data;render(data);};
 const configure=node.onConfigure;node.onConfigure=function(){configure?.apply(this,arguments);render(node.properties.completed_audio);};
}});
