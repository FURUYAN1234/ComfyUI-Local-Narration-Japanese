const fs=require('fs'),vm=require('vm'),assert=require('assert');
class E{
 constructor(tag){this.tag=tag;this.children=[];this.style={};this.value='';this.textContent='';this.dataset={};}
 append(e){this.children.push(e);e.parentElement=this;}insertBefore(e,b){const i=this.children.indexOf(b);this.children.splice(i<0?this.children.length:i,0,e);e.parentElement=this;}
 replaceChildren(){this.children=[];}setAttribute(k,v){this[k]=v;}addEventListener(k,f){this[k]=f;}showModal(){}close(){this.closed=true;}remove(){this.removed=true;}focus(){}
}
const body=new E('body'),listeners={},dictionary={};let extension;
const api={clientId:'test',addEventListener:(name,fn)=>listeners[name]=fn,fetchApi:async(url,options={})=>{
 if(url.includes('/pending'))return{ok:true,json:async()=>({pending:[]})};
 if(url.endsWith('/dictionary')){
  if(options.method==='POST'){const data=JSON.parse(options.body);if(data.action==='set')dictionary[data.word]=data.reading;else delete dictionary[data.word];}
  return{ok:true,json:async()=>({dictionary:{...dictionary}})};
 }
 if(url.endsWith('/preview'))return{ok:true,json:async()=>({readings:[dictionary['星雲']?'せいうんがひかる。':'せいくもがひかる。'],dictionary:{...dictionary}})};
 throw Error(url);
}};
const ctx={document:{body,createElement:t=>new E(t)},app:{registerExtension:e=>extension=e},api,URLSearchParams,setInterval:()=>1,Map};
vm.createContext(ctx);
const path=process.argv[2];vm.runInContext(fs.readFileSync(path,'utf8').replace(/^import .*;\n/gm,''),ctx);
const all=e=>e.children.flatMap(c=>[c,...all(c)]);
(async()=>{
 extension.setup();await new Promise(setImmediate);
 listeners['local_narration.reading_review']({detail:{request_id:'one',rows:['星雲が光る。'],readings:['せいくもがひかる。'],remembered:{},dictionary:{},engine:'Qwen'}});
 const dialog=body.children.at(-1),word=all(dialog).find(x=>x['aria-label']==='辞書に登録する単語'),reading=all(dialog).find(x=>x['aria-label']==='辞書に登録する読み'),field=all(dialog).find(x=>x['aria-label']==='台詞1の読み');
 assert(word&&reading&&field);
 word.value='星雲';reading.value='せいうん';
 await all(dialog).find(x=>x.textContent==='登録・更新').onclick();
 assert.equal(dictionary['星雲'],'せいうん');assert.equal(field.value,'せいうんがひかる。');
 field.value='手修正を保持';word.value='星雲';reading.value='せーうん';
 await all(dialog).find(x=>x.textContent==='登録・更新').onclick();
 assert.equal(field.value,'手修正を保持','manual correction must not be replaced');
 await all(dialog).find(x=>x.textContent==='削除').onclick();
 assert.equal(dictionary['星雲'],undefined);
 console.log('PASS reading review dictionary UI: add, current suggestion, manual edit preservation and delete');
})().catch(error=>{console.error(error);process.exitCode=1;});
