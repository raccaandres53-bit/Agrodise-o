import { sb } from './supabase-client.js';
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');

let currentCarrierId=null;
let aliases=new Map();
let wrapped=false;

async function loadAliases(){
  const {data,error}=await sb.from('carriers').select('id,fantasy_name');
  if(error){console.error('No se pudieron cargar nombres de fantasía',error);return}
  aliases=new Map((data||[]).map(x=>[Number(x.id),x.fantasy_name||'']));
  decorateRows();
}

function injectField(){
  const name=$('carrierName');
  if(!name||$('carrierFantasyName'))return !!$('carrierFantasyName');
  const field=document.createElement('div');
  field.className='spares-field';
  field.innerHTML='<label>Nombre de fantasía / referencia</label><input id="carrierFantasyName" placeholder="Ej. El Negro, Flete Rafaela, Juan de Devoto...">';
  name.closest('.spares-field')?.insertAdjacentElement('afterend',field);
  return true;
}

function decorateRows(){
  document.querySelectorAll('.carrier-row').forEach(row=>{
    row.querySelector('.carrier-fantasy')?.remove();
    const id=Number(row.dataset.id);
    const alias=aliases.get(id)||'';
    if(!alias)return;
    const cell=row.children[1];
    if(!cell)return;
    const div=document.createElement('div');
    div.className='sub carrier-fantasy';
    div.textContent='🏷 '+alias;
    const name=cell.querySelector('b');
    if(name)name.insertAdjacentElement('afterend',div);else cell.prepend(div);
  });
}

function applyAliasSearch(){
  const q=norm($('carrierSearch')?.value||'');
  if(!q){decorateRows();return}
  const routeSelected=!!$('routeFilter')?.value;
  document.querySelectorAll('.carrier-row').forEach(row=>{
    const id=Number(row.dataset.id);
    const alias=norm(aliases.get(id)||'');
    if(alias.includes(q)&&!routeSelected)row.style.display='';
  });
  decorateRows();
}

function trackOpen(){
  document.addEventListener('click',e=>{
    const row=e.target.closest('.carrier-row');
    if(row){
      currentCarrierId=Number(row.dataset.id)||null;
      setTimeout(()=>{const input=$('carrierFantasyName');if(input)input.value=aliases.get(currentCarrierId)||''},40);
      return;
    }
    if(e.target.closest('#newCarrier')){
      currentCarrierId=null;
      setTimeout(()=>{const input=$('carrierFantasyName');if(input)input.value=''},40);
    }
  },true);
}

function wrapSave(){
  if(wrapped)return;
  const btn=$('saveCarrier');
  if(!btn?.onclick)return;
  const original=btn.onclick;
  btn.onclick=async function(e){
    const fantasy=$('carrierFantasyName')?.value.trim()||null;
    const snapshot={name:$('carrierName')?.value.trim()||'',phone:$('carrierPhone')?.value.trim()||'',email:$('carrierEmail')?.value.trim()||''};
    const knownId=currentCarrierId;
    await original.call(this,e);
    if($('carrierModal')?.classList.contains('show'))return;
    let carrierId=knownId;
    if(!carrierId&&snapshot.name){
      const {data}=await sb.from('carriers').select('id,name,phone,contact,updated_at').eq('name',snapshot.name).order('updated_at',{ascending:false}).limit(5);
      const exact=(data||[]).find(c=>(!snapshot.phone||String(c.phone||'')===snapshot.phone)&&(!snapshot.email||String(c.contact||'')===snapshot.email));
      carrierId=Number(exact?.id||(data||[])[0]?.id)||null;
    }
    if(carrierId){
      const {error}=await sb.from('carriers').update({fantasy_name:fantasy,updated_at:new Date().toISOString()}).eq('id',carrierId);
      if(error){alert('El transportista se guardó, pero no se pudo guardar el nombre de fantasía: '+error.message);return}
      currentCarrierId=carrierId;
      aliases.set(carrierId,fantasy||'');
      decorateRows();
    }
  };
  wrapped=true;
}

function hookSearch(){
  const search=$('carrierSearch');
  if(search&&!search.dataset.fantasyHook){
    search.dataset.fantasyHook='1';
    search.addEventListener('input',()=>setTimeout(applyAliasSearch,80));
  }
}

function observeRows(){
  ['carrierRows','favoriteCarrierRows'].forEach(id=>{
    const el=$(id);
    if(el&&!el.dataset.fantasyObserved){
      el.dataset.fantasyObserved='1';
      new MutationObserver(()=>setTimeout(()=>{decorateRows();applyAliasSearch()},60)).observe(el,{childList:true,subtree:true});
    }
  });
}

function boot(){
  if(!injectField())return false;
  wrapSave();hookSearch();trackOpen();observeRows();loadAliases();
  return true;
}

if(!boot()){
  const o=new MutationObserver(()=>{if(boot())o.disconnect()});
  o.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>boot(),900);
}
