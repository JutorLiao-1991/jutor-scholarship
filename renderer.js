import {cropRect} from './awards.js';
export const SIZES={portrait:{w:1080,h:1350},square:{w:1080,h:1080},story:{w:1080,h:1920}};
const SERIF='"Noto Serif TC", "Songti TC", "PMingLiU", "Times New Roman", serif';
const SANS='"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
export function layout(size) {
  const {w,h}=SIZES[size] || SIZES.portrait;
  const bottom=size==='square'?660:size==='story'?1220:850;
  return {w,h,photo:{x:24,y:24,w:w-48,h:bottom-24},bottom,
    labelY:bottom+32,title:{x:108,y:bottom+(size==='story'?110:85),w:864,h:size==='square'?130:size==='story'?300:210},
    nameY:h-(size==='story'?200:140)};
}
function gold(ctx,x,y,w,h,warm=false) {
  const g=ctx.createLinearGradient(x,y,x+w,y+h);
  for (const [p,c] of (warm?[[0,'#ae7625'],[.24,'#f4d28a'],[.49,'#fff0bb'],[.7,'#c8983e'],[1,'#e8bf69']]:[[0,'#c49a48'],[.26,'#fff0bc'],[.5,'#d5ac5a'],[.7,'#fff0bc'],[1,'#ac7a2d']])) g.addColorStop(p,c);
  return g;
}
function line(ctx,x1,y1,x2,y2,color,width=1) {ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function diamond(ctx,x,y,r,color) {ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x+r*.2,y-r*.2,x+r,y);ctx.quadraticCurveTo(x+r*.2,y+r*.2,x,y+r);ctx.quadraticCurveTo(x-r*.2,y+r*.2,x-r,y);ctx.quadraticCurveTo(x-r*.2,y-r*.2,x,y-r);ctx.fill();}
function laurel(ctx,cx,cy,side,color,scale=1) {
  ctx.save();ctx.translate(cx,cy);ctx.scale(side*scale,scale);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(0,70);ctx.bezierCurveTo(-65,20,-68,-45,-30,-110);ctx.stroke();
  for(let i=0;i<7;i++) {const t=i/6, x=-48*Math.sin(t*Math.PI*.82), y=58-t*155;ctx.save();ctx.translate(x,y);ctx.rotate(-.7+t*.7);ctx.beginPath();ctx.ellipse(-12,-7,7,20,-.55,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(11,-16,6,17,.65,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.restore();
}
function ribbon(ctx,y,w,h,warm) {
  ctx.save();ctx.fillStyle=gold(ctx,0,y,w,100,warm);
  ctx.beginPath();ctx.moveTo(24,y-130);ctx.bezierCurveTo(w*.25,y+8,w*.4,y+25,w/2,y+25);ctx.bezierCurveTo(w*.68,y+20,w*.8,y-8,w-24,y-130);ctx.lineTo(w-24,y-92);ctx.bezierCurveTo(w*.74,y+38,w*.62,y+56,w/2,y+53);ctx.bezierCurveTo(w*.33,y+50,w*.2,y+20,24,y-92);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#fff1c3';ctx.lineWidth=2;ctx.stroke();
  ctx.globalAlpha=.22;ctx.fillStyle=gold(ctx,0,h-100,w,100,warm);ctx.beginPath();ctx.moveTo(24,h-125);ctx.bezierCurveTo(w*.3,h-5,w*.65,h+10,w-24,h-125);ctx.lineTo(w-24,h-25);ctx.bezierCurveTo(w*.55,h+25,w*.25,h+25,24,h-25);ctx.closePath();ctx.fill();ctx.restore();
}
function medal(ctx,x,y,warm) {
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle=warm?'#b1833f':'#173048';ctx.beginPath();ctx.moveTo(-20,20);ctx.lineTo(-29,65);ctx.lineTo(-7,53);ctx.lineTo(3,66);ctx.lineTo(9,23);ctx.fill();ctx.beginPath();ctx.moveTo(8,23);ctx.lineTo(18,65);ctx.lineTo(28,52);ctx.lineTo(43,60);ctx.lineTo(29,16);ctx.fill();
  ctx.fillStyle=gold(ctx,-40,-40,80,80,warm);ctx.beginPath();for(let i=0;i<48;i++){const a=i*Math.PI/24, r=i%2?37:41;const x1=Math.cos(a)*r,y1=Math.sin(a)*r;i?ctx.lineTo(x1,y1):ctx.moveTo(x1,y1);}ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(0,0,31,0,Math.PI*2);ctx.strokeStyle='#976a28';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle=warm?'#765020':'#173048';ctx.beginPath();ctx.moveTo(-18,11);ctx.lineTo(-21,-11);ctx.lineTo(-10,-2);ctx.lineTo(0,-18);ctx.lineTo(11,-2);ctx.lineTo(21,-11);ctx.lineTo(18,11);ctx.closePath();ctx.fill();line(ctx,-17,16,17,16,ctx.fillStyle,3);ctx.restore();
}
export function wrapText(ctx,text,maxWidth) {
  const lines=[];let current='';
  for(const ch of Array.from(String(text))) {if(ch==='\n'){lines.push(current);current='';continue;}if(current && ctx.measureText(current+ch).width>maxWidth){lines.push(current.trimEnd());current=ch.trimStart();}else current+=ch;}
  if(current)lines.push(current.trimEnd());return lines.length?lines:[''];
}
export function fitText(ctx,text,box,{max=100,min=14,maxLines=2,family=SERIF,weight=700}={}) {
  text=String(text).replace(/\s+/g,' ').trim();
  let size=max,lines;
  for(;size>=min;size-=2){ctx.font=`${weight} ${size}px ${family}`;lines=wrapText(ctx,text,box.w);if(lines.length<=maxLines && lines.length*size*1.25<=box.h)break;}
  if(size<min){size=min;ctx.font=`${weight} ${size}px ${family}`;lines=wrapText(ctx,text,box.w);}
  return {size,lines};
}
function textBlock(ctx,text,box,options,color) {
  const {size,lines}=fitText(ctx,text,box,options), step=size*1.25;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;
  lines.forEach((s,i)=>ctx.fillText(s,box.x+box.w/2,box.y+(box.h-(lines.length-1)*step)/2+i*step));
}
export function drawPoster(canvas,state,image=null) {
  const l=layout(state.size), {w,h,bottom}=l, warm=state.template==='warm';
  if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const bg=ctx.createLinearGradient(0,bottom,w,h);bg.addColorStop(0,warm?'#fffaf0':'#172d45');bg.addColorStop(.6,warm?'#fff5dc':'#0b1b2e');bg.addColorStop(1,warm?'#f5e4be':'#162c44');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  if(image) {
    ctx.save();ctx.beginPath();ctx.rect(l.photo.x,l.photo.y,l.photo.w,l.photo.h);ctx.clip();
    const r=cropRect(image.width || image.naturalWidth,image.height || image.naturalHeight,l.photo,state.zoom,state.x,state.y);ctx.drawImage(image,r.x,r.y,r.w,r.h);ctx.restore();
  } else {ctx.fillStyle=warm?'#e8dbbf':'#263b50';ctx.fillRect(l.photo.x,l.photo.y,l.photo.w,l.photo.h);}
  // A curved extension separates the photo and lettering without painting over faces.
  ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(24,bottom-125);ctx.bezierCurveTo(w*.3,bottom+55,w*.68,bottom+55,w-24,bottom-125);ctx.lineTo(w-24,h-24);ctx.lineTo(24,h-24);ctx.closePath();ctx.fill();
  ribbon(ctx,bottom-10,w,h,warm);
  const goldFill=gold(ctx,0,bottom,w,h-bottom,warm), ink=warm?'#68421f':'#f7e5b9';
  // Fine nested border, folded corner accents and a small award seal.
  ctx.strokeStyle=gold(ctx,0,0,w,h,warm);ctx.lineWidth=3;ctx.strokeRect(12,12,w-24,h-24);ctx.lineWidth=1;ctx.strokeRect(20,20,w-40,h-40);
  [[24,24,1,1],[w-24,24,-1,1],[24,h-24,1,-1],[w-24,h-24,-1,-1]].forEach(([x,y,sx,sy])=>{line(ctx,x,y,x+sx*25,y,ink);line(ctx,x,y,x,y+sy*25,ink);line(ctx,x,y+sy*25,x+sx*25,y,ink);});
  // A restrained grain of gold flecks keeps the decorative style reproducible.
  ctx.save();for(let i=0;i<85;i++){const px=30+((i*137.51)%(w-60)),py=bottom+70+((i*71.37)%Math.max(1,h-bottom-100));if(px<85||px>w-85){ctx.globalAlpha=.12+(i%4)*.07;ctx.fillStyle=warm?'#bc8b38':'#e1bb6d';ctx.fillRect(px,py,i%3+1,i%3+1);}}ctx.restore();
  medal(ctx,w-107,bottom-33,warm);
  const label=state.label || '獎學金表揚';
  ctx.save();ctx.fillStyle=gold(ctx,270,l.labelY-29,540,58,warm);ctx.strokeStyle=warm?'#b98b40':'#e4c27a';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(270,l.labelY-29,540,58,28);ctx.fill();ctx.stroke();
  textBlock(ctx,label,{x:300,y:l.labelY-23,w:480,h:46},{max:29,maxLines:1,family:SERIF},warm?'#6b421e':'#182b3c');ctx.restore();
  const leafY=l.title.y+l.title.h/2+12;
  laurel(ctx,88,leafY,1,goldFill,.7);laurel(ctx,w-88,leafY,-1,goldFill,.7);
  textBlock(ctx,state.title || '頒獎名目',l.title,{max:state.size==='square'?88:104,maxLines:2},warm?'#8a5724':goldFill);
  ctx.strokeStyle=warm?'#d5b273':'#b58d48';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(190,l.nameY-39,700,78,39);ctx.stroke();
  textBlock(ctx,state.name || '學生姓名',{x:215,y:l.nameY-32,w:650,h:64},{max:46,maxLines:1},ink);
  diamond(ctx,147,l.nameY,6,goldFill);diamond(ctx,w-147,l.nameY,6,goldFill);
  const fy=h-60;line(ctx,280,fy,490,fy,warm?'#d2b170':'#8e7445');line(ctx,590,fy,800,fy,warm?'#d2b170':'#8e7445');diamond(ctx,w/2,fy,10,goldFill);
  return l;
}
