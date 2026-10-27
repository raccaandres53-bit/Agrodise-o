import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const sb=createClient('https://dcmlbriqiybegmwanwlf.supabase.co','sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const colorsByName=new Map();
let loading=false;

function norm(v){return String(v||'').replace(/ · adicional$/i,'').trim().toLocaleLowerCase('es')}
function contrastColor(hex){
  const c=String(hex||'#d81f26').replace('#','');
  const r=parseInt(c.slice(0,2),16)||0,g=parseInt(c.slice(2,4),16)||0,b=parseInt(c.slice(4,6),16)||0;
  return ((r*299+g*587+b*114)/1000)>=145?'#111':'#fff';
}

async function loadColors(){
  if(loading)return;
  loading=true;
  try{
    const {data,error}=await sb.from('supplier_categories').select('name,color');
    if(error){console.error('No se pudieron cargar colores de rubros',error);return;}
    colorsByName.clear();
    (data||[]).forEach(c=>colorsByName.set(norm(c.name),c.color||'#d81f26'));
    recolorRubros();
  }finally{loading=false}
}

function lockBadgeColor(el,color){
  el.style.setProperty('background',color,'important');
  el.style.setProperty('background-color',color,'important');
  el.style.setProperty('color',contrastColor(color),'important');
  el.style.setProperty('transition','none','important');
}

function recolorRubros(){
  document.querySelectorAll('.spares-row td:nth-child(5) span').forEach(badge=>{
    const key=norm(badge.textContent);
    const color=colorsByName.get(key);
    if(!color)return;
    lockBadgeColor(badge,color);
  });

  document.querySelectorAll('#categoryList .category-item').forEach(item=>{
    const name=norm(item.querySelector('b')?.textContent);
    const dot=item.querySelector('span span');
    const color=colorsByName.get(name);
    if(dot&&color){
      dot.style.setProperty('background',color,'important');
      dot.style.setProperty('background-color',color,'important');
    }
  });
}

const observer=new MutationObserver(()=>recolorRubros());
observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
document.addEventListener('input',e=>{if(e.target?.id==='supplierSearch')recolorRubros()},true);
document.addEventListener('change',e=>{if(e.target?.id==='categoryFilter')recolorRubros()},true);
document.addEventListener('click',e=>{if(e.target?.closest('#goSpares,#sparesHomeBtn,#manageCategories,#categoriesBtn'))setTimeout(loadColors,40)},true);
loadColors();
