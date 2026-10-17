export const SCHEME = '114 上學期獎學金制度';
export const TYPES = [
  {id:'score', label:'段考高分', group:'國高中段考'},
  {id:'progress', label:'段考進步', group:'國高中段考'},
  {id:'rank', label:'段考名次', group:'國高中段考'},
  {id:'grade', label:'會考模考等第', group:'會考模考'},
  {id:'mockRank', label:'會考模考名次', group:'會考模考'},
  {id:'gsat', label:'學測模考級分', group:'學測模考'},
  {id:'gsatProgress', label:'學測模考進步', group:'學測模考'},
  {id:'custom', label:'自訂表揚', group:'其他'},
];
function numeric(value, min, max, integer = false) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n)) ? n : null;
}
export function evaluateAward(data) {
  const subject = String(data.subject || '').trim();
  const attach = value => subject ? `${subject} ${value}` : value;
  const fail = message => ({eligible:false, message, title:'', label:''});
  const ok = (title, label) => ({eligible:true, message:'符合方案條件', title, label});
  switch (data.type) {
    case 'score': {
      const n = numeric(data.score, 0, 100);
      if (n === null) return fail('請填入 0～100 分的有效分數。');
      if (n < 90) return fail('高分獎須達 90 分；也可以選擇進步獎或自訂表揚。');
      return ok(attach(`${n} 分`), n === 100 ? '段考滿分獎' : '段考成績優異獎');
    }
    case 'progress':
    case 'gsatProgress': {
      const gsat = data.type === 'gsatProgress';
      const max = gsat ? 15 : 100;
      const a = numeric(data.previous,0,max,gsat), b = numeric(data.current,0,max,gsat);
      if (a === null || b === null) return fail(`請填入 0～${max} 的有效前次與本次成績。`);
      const delta = Math.round((b-a)*100)/100;
      if (delta < (gsat?5:20)) return fail(`進步獎須進步至少 ${gsat?5:20} ${gsat?'級分':'分'}。`);
      return ok(attach(`進步 ${delta} ${gsat?'級分':'分'}`), gsat?'學測模考進步獎':'段考進步獎');
    }
    case 'rank':
    case 'mockRank': {
      if (!['school','class'].includes(data.rankScope)) return fail('請選擇校排名或班排名。');
      const n = numeric(data.rank,1,data.rankScope === 'school'?10:3,true);
      if (n === null) return fail(data.rankScope === 'school'?'校排名須為第 1～10 名。':'班排名須為第 1～3 名。');
      return ok(`${data.rankScope === 'school'?'全校':'全班'}第 ${n} 名`, data.type==='rank'?'段考名次優異獎':'會考模考名次優異獎');
    }
    case 'grade':
      return ['A++','A+','A'].includes(data.grade) ? ok(attach(data.grade),'會考模考成績優異獎') : fail('請選擇 A、A+ 或 A++。');
    case 'gsat': {
      const n = numeric(data.level,13,15,true);
      return n === null ? fail('級分獎須為 13、14 或 15 級分。') : ok(attach(`${n} 級分`),'學測模考成績優異獎');
    }
    case 'custom': {
      const t = String(data.customTitle || '').trim();
      return t ? ok(t,'榮譽表揚') : fail('請填寫頒獎名目。');
    }
    default: return fail('請選擇獎項。');
  }
}
export function displayName(name, mask) {
  const chars = Array.from(String(name || '').trim());
  if (!mask || chars.length < 2) return chars.join('');
  if (chars.length === 2) return chars[0]+'○';
  return chars[0] + '○'.repeat(chars.length-2) + chars.at(-1);
}
export function cropRect(iw, ih, box, zoom=1, x=0, y=0) {
  const scale = Math.max(box.w/iw,box.h/ih) * Math.max(1,zoom);
  const w=iw*scale, h=ih*scale;
  const dx=Math.max(box.x+box.w-w,Math.min(box.x,box.x+(box.w-w)/2+x));
  const dy=Math.max(box.y+box.h-h,Math.min(box.y,box.y+(box.h-h)/2+y));
  return {x:dx,y:dy,w,h};
}
