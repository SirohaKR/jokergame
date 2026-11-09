// Generated only from a validated project. Artwork becomes a labelled placeholder.
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function wireframeSVG(scene,title='UI 와이어프레임'){
 const nodes=scene.elements.filter(e=>e.visible).map((e,index)=>{
  const image=Boolean(e.src),text=image?e.name:(e.text||e.name),font=Math.min(e.fontSize,image?24:160),max=Math.max(1,Math.floor((e.w-16)/(font*.7)));
  const lines=text.split('\n').flatMap(line=>{const chars=Array.from(line),out=[];for(let i=0;i<chars.length;i+=max)out.push(chars.slice(i,i+max).join(''));return out.length?out:[''];}).slice(0,Math.max(1,Math.floor((e.h-8)/(font*1.3))));
  const x=image||e.align==='center'?e.w/2:e.align==='left'?8:e.w-8,anchor=image?'middle':({left:'start',center:'middle',right:'end'})[e.align];
  return `<g transform="translate(${e.x} ${e.y}) rotate(${e.rotation} ${e.w/2} ${e.h/2})"><title>${escape(e.name)}${e.role?' · '+escape(e.role):''}</title><defs><clipPath id="clip-${index}"><rect width="${e.w}" height="${e.h}" rx="${Math.min(e.radius,12)}"/></clipPath></defs><g clip-path="url(#clip-${index})"><rect x="1" y="1" width="${e.w-2}" height="${e.h-2}" rx="${Math.min(e.radius,12)}" fill="${e.type==='text'?'#fff':'#f1f3f5'}" stroke="#6c7582" stroke-width="2"${e.type==='text'?' stroke-dasharray="4 4"':''}/>${image?`<path d="M 0 0 L ${e.w} ${e.h} M ${e.w} 0 L 0 ${e.h}" stroke="#c8cdd3"/>`:''}<text x="${x}" text-anchor="${anchor}" fill="#253142" font-family="sans-serif" font-size="${font}">${lines.map((line,i)=>`<tspan x="${x}" y="${e.h/2+(i-(lines.length-1)/2)*font*1.3+font*.35}">${escape(line)}</tspan>`).join('')}</text></g></g>`;
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" role="img"><title>${escape(title)}</title><rect width="100%" height="100%" fill="#fff"/>${nodes}</svg>`;
}
