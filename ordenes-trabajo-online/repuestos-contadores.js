import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

let refreshTimer=null;
let refreshing=false;

function ensureCounters(){
  const main=document.querySelector('#sparesApp .spares-main');
  const filters=main?.querySelector('.spares-filters');
  if(!main||!filters)return false;

  let stats=document.getElementById('supplierStats');
  if(!stats){
    filters.insertAdjacentHTML('beforebegin',`
      <div id="supplierStats" class="stats supplier-stats" style="margin:18px 0;grid-template-columns:repeat(2,minmax(0,1fr))">
        <div class="card"><div class="sub">Proveedores</div><div class="num" id="supplierStatTotal">0</div></div>
        <div class="card"><div class="sub">Favoritos</div><div class="num" id="supplierStatFavorites">0</div></div>
      </div>`);
    stats=document.getElementById('supplierStats');
  }

  document.getElementById('supplierStatCategories')?.closest('.card')?.remove();
  if(stats)stats.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';
  return true;
}

async function refreshCounters(){
  if(refreshing||!ensureCounters())return;
  refreshing=true;
  try{
    const {data,error}=await sb.from('suppliers').select('id,is_favorite');
    if(error){console.error('No se pudieron actualizar los contadores de proveedores',error);return;}
    const rows=data||[];
    const total=rows.length;
    const favorites=rows.filter(x=>x.is_favorite===true).length;
    const a=document.getElementById('supplierStatTotal');
    const b=document.getElementById('supplierStatFavorites');
    if(a)a.textContent=String(total);
    if(b)b.textContent=String(favorites);
  }finally{
    refreshing=false;
  }
}

function scheduleRefresh(delay=120){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(refreshCounters,delay);
}

function attach(){
  if(!ensureCounters())return;

  const go=document.getElementById('goSpares');
  if(go&&!go.dataset.counterBound){go.dataset.counterBound='1';go.addEventListener('click',()=>scheduleRefresh(50));}

  const home=document.getElementById('sparesHomeBtn');
  if(home&&!home.dataset.counterBound){home.dataset.counterBound='1';home.addEventListener('click',()=>scheduleRefresh(50));}

  const lists=document.getElementById('supplierLists');
  if(lists&&!lists.dataset.counterWatch){
    lists.dataset.counterWatch='1';
    new MutationObserver(()=>scheduleRefresh(50)).observe(lists,{childList:true,subtree:true});
  }

  const modal=document.getElementById('supplierModal');
  if(modal&&!modal.dataset.counterWatch){
    modal.dataset.counterWatch='1';
    new MutationObserver(()=>{
      if(!modal.classList.contains('show'))scheduleRefresh(50);
    }).observe(modal,{attributes:true,attributeFilter:['class']});
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('.favorite-star'))scheduleRefresh(250);
  },true);

  scheduleRefresh(0);
}

const obs=new MutationObserver(()=>attach());
obs.observe(document.body,{childList:true,subtree:true});
attach();
