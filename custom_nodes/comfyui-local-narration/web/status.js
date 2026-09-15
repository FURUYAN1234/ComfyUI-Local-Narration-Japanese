import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";
let panel,timer,ticker,started=0,phase='',active=false,consulting=false;
function stop(){clearInterval(ticker);ticker=null;}
function show(text,state){
 if(!panel){panel=document.createElement('div');panel.id='local-narration-status';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');Object.assign(panel.style,{position:'fixed',top:'78px',left:'50%',transform:'translateX(-50%)',zIndex:'100000',maxWidth:'min(760px,90vw)',padding:'14px 22px',border:'2px solid',borderRadius:'10px',font:'bold 16px/24px system-ui',whiteSpace:'pre-line',textAlign:'center',pointerEvents:'none'});document.body.append(panel);}
 clearTimeout(timer);panel.hidden=false;panel.dataset.state=state;panel.textContent=text;
 panel.style.color='#fff';panel.style.background=state==='error'?'#581d24':state==='complete'?'#124f2d':'#263a50';panel.style.borderColor=state==='error'?'#ff7b85':state==='complete'?'#55e08b':'#77baff';
 if(state==='complete'||state==='error'||state==='cancelled')timer=setTimeout(()=>panel.hidden=true,25000);
}
function running(text){if(!active)started=Date.now();active=true;phase=text;stop();const update=()=>show('⏳ '+phase+'\n経過 / Elapsed: '+Math.floor((Date.now()-started)/1000)+'秒','running');update();ticker=setInterval(update,1000);}
function finish(text,state='complete'){stop();active=false;show(text,state);}
api.addEventListener('local_narration.consult_status',({detail:d})=>{
 if(d.state==='detach'){if(panel)document.body.append(panel);return;}
 if(d.state==='running'){consulting=true;active=false;running(d.text);d.dialog.append(panel);return;}
 consulting=false;finish(d.text,d.state==='error'?'error':'complete');
 if(d.state==='cancel')document.body.append(panel);
});
api.addEventListener('local_narration.status',({detail:d})=>{if(consulting||!d||!app.graph?.getNodeById(d.node))return;if(d.state==='cancelled'){finish('↩ '+d.text,'cancelled');return;}if(d.state==='error'){finish('⚠️ '+d.text,'error');return;}if(d.terminal){finish('✅ '+d.text);return;}if(d.state==='running'||active)running(d.text);});
api.addEventListener('executed',({detail:d})=>{const a=d?.output?.completed_audio?.[0];if(consulting||!a)return;finish('✅ 音声生成完了 / Narration complete\n最後の再生・保存ノードで全体・台詞別に再生できます。');});
api.addEventListener('execution_success',()=>{if(active&&!consulting)finish('✅ 処理完了 / Completed');});
for(const [event,text] of [['execution_error','処理に失敗しました。実行エラーを確認してください / Failed'],['execution_interrupted','処理を中止しました / Cancelled'],['reconnecting','接続が切れました。処理状態は未確認です / Disconnected; status unknown']])api.addEventListener(event,()=>{if(active&&!consulting)finish('⚠️ '+text,'error');});

const queue=api.queuePrompt;
api.queuePrompt=async function(number,payload){const relevant=Object.values(payload?.output||payload?.prompt||{}).some(n=>n.class_type==='LocalNarrationGenerate');if(relevant)running('実行受付・開始待ち / Waiting to start');try{return await queue.apply(this,arguments);}catch(e){if(relevant)finish('⚠️ 送信失敗・入力エラーを確認 / Submission failed','error');throw e;}};
