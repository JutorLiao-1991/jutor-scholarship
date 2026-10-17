import {TYPES,evaluateAward,displayName,cropRect} from './awards.js';
import {drawPoster,layout,SIZES} from './renderer.js';
const $=id=>document.getElementById(id);
const canvas=$('preview'), form=$('editor');
const state={template:'glory',size:'portrait',zoom:1,x:0,y:0};
let photo=null,photoName='',loadSerial=0,loading=false,exporting=false,drag=null,frame=0,exportURL=null;
const hint={score:'高分獎：90～99 分、100 分。',progress:'進步獎：本次比前次進步至少 20 分。',rank:'名次獎：校排 1～10 名，或班排 1～3 名。',mockRank:'名次獎：校排 1～10 名，或班排 1～3 名。',grade:'會考模考：A、A+、A++。',gsat:'學測模考：13、14、15 級分。',gsatProgress:'學測模考進步：單科進步至少 5 級分。',custom:'可自行填寫其他值得表揚的成就。'};
for(const group of [...new Set(TYPES.map(t=>t.group))]) {const el=document.createElement('optgroup');el.label=group;for(const t of TYPES.filter(t=>t.group===group)){const o=document.createElement('option');o.value=t.id;o.textContent=t.label;el.append(o);}$('awardType').append(el);}
function data(){return Object.fromEntries(['score','subject','previous','current','rankScope','rank','grade','level','customTitle'].map(k=>[k,$(k).value]).concat([['type',$('awardType').value]]));}
function ready(){return photo && !loading && !exporting && $('student').value.trim() && evaluateAward(data()).eligible;}
function queueDraw(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
function clearDownload(){if(exportURL){URL.revokeObjectURL(exportURL);exportURL=null;}$('saveFallback').hidden=true;}
function draw(){
  const result=evaluateAward(data());
  state.name=displayName($('student').value,$('maskName').checked);
  state.title=$('headline').value.trim() || result.title;
  state.label=$('awardLabel').value.trim() || result.label;
  if(state.label==='榮譽表揚' && $('awardType').value==='custom')state.label='榮譽表揚';
  drawPoster(canvas,state,photo);
  canvas.setAttribute('aria-label',photo?`頒獎照預覽：${state.name || '未填姓名'}，${state.label}，${state.title || '未填名目'}`:'請選取頒獎照片');
  $('emptyOverlay').hidden=Boolean(photo);
  const size=SIZES[state.size];$('dimensions').textContent=`${size.w} × ${size.h}`;
  canvas.style.setProperty('--preview-width',`${74*size.w/size.h}vh`);
  $('awardStatus').textContent=result.eligible?`✓ ${result.label} · ${result.title}`:result.message;
  $('awardStatus').classList.toggle('valid',result.eligible);
  $('headline').placeholder=result.title || '由成績自動產生';$('awardLabel').placeholder=result.label || '例如：段考滿分獎';
  const enabled=Boolean(ready());$('download').disabled=!enabled;$('share').disabled=!enabled;
  if(!loading&&!exporting)$('exportStatus').textContent=enabled?'可下載高畫質成品，或繼續微調照片位置。':!photo?'請先選取照片。':!$('student').value.trim()?'請填寫學生姓名。':result.message;
  $('share').hidden=!(navigator.canShare && navigator.share);
}
function typeChanged(){
  const type=$('awardType').value;
  const key=['progress','gsatProgress'].includes(type)?'progress':['rank','mockRank'].includes(type)?'rank':type;
  document.querySelectorAll('[data-field]').forEach(el=>el.hidden=el.dataset.field!==key);
  $('subjectField').hidden=['rank','mockRank','custom'].includes(type);
  $('ruleHint').textContent=hint[type];
  const gsat=type==='gsatProgress';for(const id of ['previous','current']){$(id).max=gsat?'15':'100';$(id).step=gsat?'1':'0.1';$(id).inputMode=gsat?'numeric':'decimal';}
  $('previous').placeholder=gsat?'例如：8':'例如：55';$('current').placeholder=gsat?'例如：13':'例如：78';
  $('headline').value='';$('awardLabel').value='';queueDraw();
}
function resetCrop(){state.zoom=1;state.x=0;state.y=0;$('zoom').value='1';$('zoomValue').value='100%';queueDraw();}
async function loadPhoto(file){
  if(!file)return;
  const serial=++loadSerial;loading=true;clearDownload();$('exportStatus').textContent='正在讀取照片…';$('photoState').textContent='讀取中';draw();
  let bitmap=null,url=null;
  try{
    if(!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name))throw new Error('請選取圖片檔案。');
    if(file.size>45*1024*1024)throw new Error('照片超過 45 MB，請先縮小或另存為 JPG。');
    if(typeof createImageBitmap==='function') {
      try {bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});} catch { /* HTMLImageElement supports a different set of device formats. */ }
    }
    if(!bitmap){url=URL.createObjectURL(file);const img=new Image();img.src=url;await img.decode();bitmap=img;}
    if(serial!==loadSerial){bitmap.close?.();return;}
    // Limit decoded texture dimensions for mobile canvas memory without altering the original file.
    const iw=bitmap.width || bitmap.naturalWidth,ih=bitmap.height || bitmap.naturalHeight;
    if(!iw||!ih)throw new Error('無法讀取照片尺寸。');
    if(Math.max(iw,ih)>4096){
      const temp=document.createElement('canvas');const ratio=4096/Math.max(iw,ih);temp.width=Math.round(iw*ratio);temp.height=Math.round(ih*ratio);temp.getContext('2d').drawImage(bitmap,0,0,temp.width,temp.height);bitmap.close?.();bitmap=temp;
    }
    photo?.close?.();photo=bitmap;photoName=file.name;resetCrop();$('photoControls').hidden=false;$('photoState').textContent='已選取';$('uploadTitle').textContent='更換照片';$('uploadInfo').textContent=file.name;
  }catch(err){if(serial===loadSerial){$('photoState').textContent=photo?'已保留原照片':'讀取失敗';$('uploadInfo').textContent=/heic|heif/i.test(file.name)?'這個瀏覽器無法讀取此照片，請改用 JPG 或 PNG。':err.message;$('uploadTitle').textContent='重新選取照片';}}
  finally{if(url)URL.revokeObjectURL(url);if(serial===loadSerial){loading=false;draw();}}
}
$('photo').addEventListener('change',e=>{loadPhoto(e.target.files?.[0]);e.target.value='';});
const zone=$('dropZone');
for(const event of ['dragenter','dragover'])zone.addEventListener(event,e=>{e.preventDefault();zone.classList.add('dragging');});
for(const event of ['dragleave','drop'])zone.addEventListener(event,e=>{e.preventDefault();zone.classList.remove('dragging');});
zone.addEventListener('drop',e=>loadPhoto(e.dataTransfer.files?.[0]));
form.addEventListener('submit',e=>e.preventDefault());
form.addEventListener('input',e=>{
  clearDownload();
  if(e.target.id==='awardType')return;
  if(e.target.name==='template')state.template=e.target.value;
  if(e.target.id==='size'){state.size=e.target.value;resetCrop();}
  if(e.target.id==='zoom'){
    const old=state.zoom;state.zoom=Number(e.target.value);state.x*=state.zoom/old;state.y*=state.zoom/old;clampPosition();$('zoomValue').value=`${Math.round(state.zoom*100)}%`;
  }
  if(['score','subject','previous','current','rankScope','rank','grade','level','customTitle'].includes(e.target.id)){$('headline').value='';$('awardLabel').value='';}
  queueDraw();
});
$('awardType').addEventListener('change',typeChanged);
$('rankScope').addEventListener('change',()=>{$('rank').max=$('rankScope').value==='school'?'10':'3';});
$('resetPhoto').addEventListener('click',()=>{clearDownload();resetCrop();});
$('resetText').addEventListener('click',()=>{$('headline').value='';$('awardLabel').value='';clearDownload();queueDraw();});
function clampPosition(){if(!photo)return;const box=layout(state.size).photo;const r=cropRect(photo.width || photo.naturalWidth,photo.height || photo.naturalHeight,box,state.zoom,state.x,state.y);state.x=r.x-box.x-(box.w-r.w)/2;state.y=r.y-box.y-(box.h-r.h)/2;}
function point(e){const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*canvas.width/rect.width,y:(e.clientY-rect.top)*canvas.height/rect.height};}
canvas.addEventListener('pointerdown',e=>{if(!photo||loading)return;const p=point(e),b=layout(state.size).photo;if(p.x<b.x||p.x>b.x+b.w||p.y<b.y||p.y>b.y+b.h)return;drag={id:e.pointerId,...p};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');e.preventDefault();});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const p=point(e);state.x+=p.x-drag.x;state.y+=p.y-drag.y;drag={id:e.pointerId,...p};clampPosition();clearDownload();queueDraw();});
for(const evt of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(evt,()=>{drag=null;canvas.classList.remove('dragging');});
canvas.addEventListener('keydown',e=>{if(!photo||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();state.x+=(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0)*(e.shiftKey?40:10);state.y+=(e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0)*(e.shiftKey?40:10);clampPosition();clearDownload();queueDraw();});
function fileName(){const ext=$('format').value==='image/png'?'png':'jpg';const clean=s=>s.replace(/[\x00-\x1f\\/:*?"<>|]/g,'').slice(0,40);return `${clean(state.name)}_${clean(state.title)}_${state.template==='warm'?'溫暖表揚':'榮耀金'}.${ext}`;}
function makeBlob(){draw();return new Promise((resolve,reject)=>{try{canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('圖片輸出失敗，請再試一次。')),$('format').value,.95);}catch(e){reject(e);}});}
async function exportImage(share=false){
  if(!ready())return;
  exporting=true;$('download').disabled=true;$('share').disabled=true;$('exportStatus').textContent='正在合成高畫質圖片…';
  try{
    if(document.fonts?.ready)await document.fonts.ready;
    const blob=await makeBlob(),name=fileName();
    if(share){
      const file=new File([blob],name,{type:blob.type});
      if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file]});$('exportStatus').textContent='已開啟分享選單。';return;}
    }
    clearDownload();exportURL=URL.createObjectURL(blob);const a=$('saveFallback');a.href=exportURL;a.download=name;a.hidden=false;a.textContent='再次下載／儲存圖片';a.click();$('exportStatus').textContent='圖片已備妥。若未自動儲存，請點下方連結。';
  }catch(err){$('exportStatus').textContent=err.name==='AbortError'?'已取消分享，可以繼續編輯。':`無法輸出：${err.message}`;}
  finally{exporting=false;const valid=Boolean(ready());$('download').disabled=!valid;$('share').disabled=!valid;}
}
$('download').addEventListener('click',()=>exportImage());$('share').addEventListener('click',()=>exportImage(true));
$('format').addEventListener('change',clearDownload);
window.addEventListener('pagehide',()=>{clearDownload();});
typeChanged();draw();
