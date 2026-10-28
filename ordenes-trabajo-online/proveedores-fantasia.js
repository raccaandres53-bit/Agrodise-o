import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const sb=createClient('https://dcmlbriqiybegmwanwlf.supabase.co','sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=s=>String(s||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');

let fantasyById=new Map();
let currentSupplierId=null;
let saveWrapped=false;
let searchWrapped=false;
let observerStarted=false;

async function loadFantasy(){
  const {data,error}=await sb.from('suppliers').select('id,fantasy_name');
  if(error){console.error('No se pudieron cargar nombres de fantasía de proveedores',error);return}
  fantasyById=new Map((data||[]).map(s=>[Number(s.id),s.fantasy_name||'']));
  patchRows();
  applySearch();
}

function ensureField(){
  const name=$('supplierName');
  if(!name)return false;
  if($('supplierFantasyName'))return true;
  const field=name.closest('.spares-field');
  if(!field)return false;
  const extra=document.createElement('div');
  extra.className='spares-field';
  extra.innerHTML='<label>Nombre de fantasía / referencia</label><input id="supplierFantasyName" placeholder="Ej. El Negro, Flete Rafaela, Juan de Devoto...">';
  field.insertAdjacentElement('afterend',extra);
  attachTracking();
  wrapSave();
  wrapSearch();
  observeRows();
  loadFantasy();
  return true;
}

function attachTracking(){
  document.addEventListener('click',e=>{
    const row=e.target.closest('.spares-row');
    if(row){
      currentSupplierId=Number(row.dataset.id)||null;
      setTimeout(()=>{const input=$('supplierFantasyName');if(input)input.value=fantasyById.get(currentSupplierId)||''},60);
      return;
    }
    if(e.target.closest('#newSupplier')){
      currentSupplierId=null;
      setTimeout(()=>{const input=$('supplierFantasyName');if(input)input.value=''},60);
    }
  },true);
}

function wrapSave(){
  if(saveWrapped)return;
  const btn=$('saveSupplier');
  if(!btn?.onclick)return;
  const original=btn.onclick;
  btn.onclick=async function(e){
    const fantasy=$('supplierFantasyName')?.value.trim()||'';
    const snapshot={name:$('supplierName')?.value.trim()||'',phone:$('supplierPhone')?.value.trim()||'',email:$('supplierContact')?.value.trim()||''};
    const knownId=currentSupplierId;
    await original.call(this,e);
    if($('supplierModal')?.classList.contains('show'))return;
    let supplierId=knownId;
    if(!supplierId&&snapshot.name){
      const {data}=await sb.from('suppliers').select('id,name,phone,contact,updated_at').eq('name',snapshot.name).order('updated_at',{ascending:false}).limit(5);
      const exact=(data||[]).find(s=>(!snapshot.phone||String(s.phone||'')===snapshot.phone)&&(!snapshot.email||String(s.contact||'')===snapshot.email));
      supplierId=Number(exact?.id||(data||[])[0]?.id)||null;
    }
    if(supplierId){
      const {error}=await sb.from('suppliers').update({fantasy_name:fantasy||null,updated_at:new Date().toISOString()}).eq('id',supplierId);
      if(error){alert('El proveedor se guardó, pero no se pudo guardar el nombre de fantasía: '+error.message);return}
      fantasyById.set(supplierId,fantasy);
      currentSupplierId=supplierId;
      patchRows();
    }
  };
  saveWrapped=true;
}

function patchRows(){
  document.querySelectorAll('.spares-row').forEach(row=>{
    const id=Number(row.dataset.id);
    const cell=row.children[1];
    if(!cell)return;
    let line=cell.querySelector('.supplier-fantasy-line');
    const fantasy=fantasyById.get(id)||'';
    if(!fantasy){line?.remove();return}
    if(!line){line=document.createElement('div');line.className='sub supplier-fantasy-line';line.style.marginTop='3px';const b=cell.querySelector('b');b?.insertAdjacentElement('afterend',line)}
    line.innerHTML='🏷 '+esc(fantasy);
  });
}

function wrapSearch(){
  if(searchWrapped)return;
  const search=$('supplierSearch');
  if(!search?.oninput)return;
  const original=search.oninput;
  search.oninput=function(e){
    const value=this.value;
    this.value='';
    original.call(this,e);
    this.value=value;
    setTimeout(()=>{patchRows();applySearch()},20);
  };
  searchWrapped=true;
}

function applySearch(){
  const q=norm($('supplierSearch')?.value||'');
  if(!q)return;
  document.querySelectorAll('.spares-row').forEach(row=>{
    const id=Number(row.dataset.id);
    const own=norm(row.textContent);
    const fantasy=norm(fantasyById.get(id)||'');
    row.style.display=(own.includes(q)||fantasy.includes(q))?'':'none';
  });
}

function observeRows(){
  if(observerStarted)return;
  const list=$('supplierLists');
  if(!list)return;
  observerStarted=true;
  new MutationObserver(()=>setTimeout(()=>{patchRows();applySearch()},20)).observe(list,{childList:true,subtree:true});
}

function boot(){
  if(ensureField())return;
  const o=new MutationObserver(()=>{if(ensureField())o.disconnect()});
  o.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>ensureField(),700);
}
boot();
