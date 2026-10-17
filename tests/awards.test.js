import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAward,displayName,cropRect} from '../awards.js';
import {drawPoster,layout,SIZES,fitText} from '../renderer.js';
test('score boundaries and invalid values',()=>{
  for(const n of [90,99,99.5,100])assert.equal(evaluateAward({type:'score',score:n,subject:'數學'}).eligible,true);
  for(const n of ['',null,undefined,-1,89.99,101,Infinity,'abc'])assert.equal(evaluateAward({type:'score',score:n}).eligible,false);
  assert.equal(evaluateAward({type:'score',score:100,subject:'數學'}).label,'段考滿分獎');
});
test('progress uses current minus previous, including exact thresholds',()=>{
  assert.equal(evaluateAward({type:'progress',previous:55,current:78,subject:'數學'}).title,'數學 進步 23 分');
  assert.equal(evaluateAward({type:'progress',previous:80,current:100}).eligible,true);
  for(const values of [[80,99.9],[100,80],['',90],[0,101]])assert.equal(evaluateAward({type:'progress',previous:values[0],current:values[1]}).eligible,false);
  assert.equal(evaluateAward({type:'gsatProgress',previous:8,current:13}).eligible,true);
  for(const values of [[8,12],[10,16],[7.5,13],['',15]])assert.equal(evaluateAward({type:'gsatProgress',previous:values[0],current:values[1]}).eligible,false);
});
test('rank eligibility is bounded and integral for both exam types',()=>{
  for(const type of ['rank','mockRank']){
    for(const n of [1,5,6,10])assert.equal(evaluateAward({type,rankScope:'school',rank:n}).eligible,true);
    for(const n of [0,11,2.5,''])assert.equal(evaluateAward({type,rankScope:'school',rank:n}).eligible,false);
    for(const n of [1,2,3])assert.equal(evaluateAward({type,rankScope:'class',rank:n}).eligible,true);
    assert.equal(evaluateAward({type,rankScope:'class',rank:4}).eligible,false);
  }
});
test('grade, GSAT and custom award validation',()=>{
  for(const grade of ['A','A+','A++'])assert.equal(evaluateAward({type:'grade',grade}).eligible,true);
  assert.equal(evaluateAward({type:'grade',grade:'B++'}).eligible,false);
  for(const level of [13,14,15])assert.equal(evaluateAward({type:'gsat',level}).eligible,true);
  for(const level of [12,16,13.5,''])assert.equal(evaluateAward({type:'gsat',level}).eligible,false);
  assert.equal(evaluateAward({type:'custom',customTitle:' 努力不懈獎 '}).title,'努力不懈獎');
  assert.equal(evaluateAward({type:'custom',customTitle:'  '}).eligible,false);
});
test('name masking preserves first and last characters',()=>{
  assert.equal(displayName(' 王小明 ',true),'王○明');assert.equal(displayName('王明',true),'王○');assert.equal(displayName('歐陽小明',true),'歐○○明');assert.equal(displayName('王',true),'王');assert.equal(displayName('王小明',false),'王小明');
});
test('crop never exposes blank edges with landscape or portrait photos',()=>{
  for(const size of Object.keys(SIZES))for(const [iw,ih] of [[1152,1536],[4032,3024],[600,2400],[2400,600]])for(const zoom of [1,1.5,3])for(const [x,y] of [[0,0],[1e6,-1e6],[-1e6,1e6]]){
    const b=layout(size).photo,r=cropRect(iw,ih,b,zoom,x,y);
    assert.ok(r.x<=b.x+1e-8&&r.y<=b.y+1e-8);assert.ok(r.x+r.w>=b.x+b.w-1e-8&&r.y+r.h>=b.y+b.h-1e-8);
  }
});
function mockCanvas(){
  const texts=[];let font='';
  const ctx=new Proxy({
    set font(v){font=v},get font(){return font},
    measureText(s){return {width:Array.from(s).length*(parseFloat(font.match(/([\d.]+)px/)?.[1])||16)}},
    createLinearGradient(){return {addColorStop(){}}},
    fillText(text,x,y){texts.push({text,x,y,font})},
  },{get(obj,key){return key in obj?obj[key]:()=>{};}});
  return {width:0,height:0,texts,getContext:()=>ctx};
}
test('both templates render at every size with only award and name text',()=>{
  for(const template of ['glory','warm'])for(const size of Object.keys(SIZES)){
    const c=mockCanvas();drawPoster(c,{template,size,title:'數學 100 分',label:'段考滿分獎',name:'王○明',zoom:1,x:0,y:0});
    assert.equal(c.width,SIZES[size].w);assert.equal(c.height,SIZES[size].h);
    assert.deepEqual(c.texts.map(t=>t.text),['段考滿分獎','數學 100 分','王○明']);
    for(const t of c.texts){assert.ok(t.x>0&&t.x<c.width);assert.ok(t.y>0&&t.y<c.height);assert.ok(!/元|獎金|@jutor/.test(t.text));}
  }
});
test('maximum input text fits without truncating student names or awards',()=>{
  const c=mockCanvas();
  for(const size of Object.keys(SIZES)){
    const box=layout(size).title,ctx=c.getContext('2d'),text='成'.repeat(60),fit=fitText(ctx,text,box,{max:104,maxLines:2});
    assert.equal(fit.lines.join(''),text);assert.ok(fit.lines.length<=2);assert.ok(fit.lines.length*fit.size*1.25<=box.h);
    assert.ok(fit.lines.every(s=>ctx.measureText(s).width<=box.w));
  }
});
