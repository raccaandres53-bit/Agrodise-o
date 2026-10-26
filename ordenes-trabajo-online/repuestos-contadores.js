import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

let refreshTimer=null;

function ensureCounters(){
  const main=document.querySelector('#sparesApp .spares-main');
  const filters=main?.querySelector('.spares-filters');
  if(!main||!filters||document.getElementById('supplierStats'))return false;
  filters.insertAdjacentHTML('beforebegin',`
    <div id="supplierStats" class="stats supplier-stats" style="margin:18px 0;grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="card"><div class="sub">Proveedores</div><div class="num" id="supplierStatTotal">0</div></div>
      <div class="card"><div class="sub">Favoritos</div><div class="num" id="supplierStatFavorites">0</div></div>
      <div class="card"><div class="sub">Rubros</div><div class="num" id="supplierStatCategories">0</div></div>
    </div>`);
  return true;
}

async function refreshCounters(){
  if(!ensureCounters())return;
  const [{count:total,error:e1},{count:favorites,error:e2},{count:categories,error:e3}]=await Promise.all([
    sb.from('suppliers').select('*',{count:'exact',head:true}),
    sb.from('suppliers').select('*',{count:'exact',head:true}).eq('is_favorite',true),
    sb.from('supplier_categories').select('*',{count:'exact',head:true})
  ]);
  if(e1||e2||e3)return;
  const a=document.getElementById('supplierStatTotal'),b=document.getElementById('supplierStatFavorites'),c=document.getElementById('supplierStatCategories');
  if(a)a.textContent=total??0;if(b)b.textContent=favorites??0;if(c)c.textContent=categories??0;
}

function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshCounters,250)}

function attach(){
  ensureCounters();
  document.getElementById('goSpares')?.addEventListener('click',scheduleRefresh);
  document.getElementById('sparesHomeBtn')?.addEventListener('click',scheduleRefresh);
  document.addEventListener('click',e=>{
    if(e.target.closest('#saveSupplier,#deleteSupplier,#addCategory,.remove-category,.favorite-star'))setTimeout(refreshCounters,500);
  });
  const lists=document.getElementById('supplierLists');if(lists&&!lists.dataset.counterWatch){lists.dataset.counterWatch='1';new MutationObserver(scheduleRefresh).observe(lists,{childList:true,subtree:true});}
  refreshCounters();
}

const obs=new MutationObserver(()=>{if(ensureCounters())attach()});
obs.observe(document.body,{childList:true,subtree:true});
attach();
