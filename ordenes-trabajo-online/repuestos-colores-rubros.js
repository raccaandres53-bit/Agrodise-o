const palette=['#d81f26','#2563eb','#16a34a','#f59e0b','#7c3aed','#0891b2','#db2777','#ea580c','#4f46e5','#65a30d'];

function categoryColor(value){
  const key=String(value||'sin-rubro').replace(/ · adicional$/i,'').trim();
  let hash=0;
  for(let i=0;i<key.length;i++)hash=(hash*31+key.charCodeAt(i))>>>0;
  return palette[hash%palette.length];
}
function contrastColor(hex){
  const c=hex.replace('#','');
  const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);
  return ((r*299+g*587+b*114)/1000)>=145?'#111':'#fff';
}
function recolorRubros(){
  document.querySelectorAll('.spares-row td:nth-child(5) span').forEach(badge=>{
    const name=(badge.textContent||'').replace(/ · adicional$/i,'').trim();
    if(!name)return;
    const color=categoryColor(name);
    badge.style.background=color;
    badge.style.color=contrastColor(color);
  });
}

const observer=new MutationObserver(()=>setTimeout(recolorRubros,20));
observer.observe(document.body,{childList:true,subtree:true});
document.addEventListener('input',e=>{if(e.target?.id==='supplierSearch')setTimeout(recolorRubros,30)},true);
document.addEventListener('change',e=>{if(e.target?.id==='categoryFilter')setTimeout(recolorRubros,30)},true);
setTimeout(recolorRubros,300);
