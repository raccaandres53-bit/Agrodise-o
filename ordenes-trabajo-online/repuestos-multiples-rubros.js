import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const sb=createClient('https://dcmlbriqiybegmwanwlf.supabase.co','sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const norm=s=>String(s||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');

let categories=[];
let assignments=[];
let currentSupplierId=null;
let saveWrapped=false;
let filtersWrapped=false;
let rendering=false;

function categoryById(id){return categories.find(c=>Number(c.id)===Number(id))}
function assignmentsFor(supplierId){return assignments.filter(a=>Number(a.supplier_id)===Number(supplierId))}
function categoryTextFor(supplierId){return assignmentsFor(supplierId).map(a=>categoryById(a.category_id)?.name||'').join(' ')}

async function loadMultiData(){
  const [{data:c,error:ce},{data:a,error:ae}]=await Promise.all([
    sb.from('supplier_categories').select('id,name').order('name'),
    sb.from('supplier_category_assignments').select('supplier_id,category_id,is_primary')
  ]);
  if(ce||ae){console.error('No se pudieron cargar rubros múltiples',ce||ae);return}
  categories=c||[];assignments=a||[];
  syncExtraSelectOptions();
  patchRowsAndFilter();
}

function ensureUI(){
  const select=$('supplierCategory');
  if(!select||$('addSupplierCategoryBtn'))return !!$('addSupplierCategoryBtn');
  const field=select.closest('.spares-field');
  if(!field)return false;
  const row=document.createElement('div');
  row.style.cssText='display:flex;gap:8px;align-items:center';
  select.parentNode.insertBefore(row,select);
  row.appendChild(select);
  select.style.flex='1';
  const btn=document.createElement('button');
  btn.type='button';btn.id='addSupplierCategoryBtn';btn.className='btn dark';btn.textContent='+ Agregar rubro';btn.style.whiteSpace='nowrap';
  row.appendChild(btn);
  const extras=document.createElement('div');extras.id='supplierExtraCategories';extras.style.cssText='display:grid;gap:8px;margin-top:9px';field.appendChild(extras);
  const hint=document.createElement('div');hint.className='sub';hint.textContent='Podés asociar varios rubros al mismo proveedor.';hint.style.marginTop='6px';field.appendChild(hint);
  btn.onclick=()=>addExtraCategory();
  wrapSave();wrapFilters();attachOpenTracking();observeRows();loadMultiData();
  return true;
}

function optionsHtml(value=''){
  return '<option value="">Elegir rubro...</option>'+categories.map(c=>`<option value="${c.id}" ${String(c.id)===String(value)?'selected':''}>${esc(c.name)}</option>`).join('')
}
function addExtraCategory(value=''){
  const box=$('supplierExtraCategories');if(!box)return;
  const line=document.createElement('div');line.className='supplier-extra-category-line';line.style.cssText='display:flex;gap:8px;align-items:center';
  line.innerHTML=`<select class="spares-select supplier-extra-category" style="flex:1">${optionsHtml(value)}</select><button type="button" class="mini remove-extra-category">×</button>`;
  line.querySelector('.remove-extra-category').onclick=()=>line.remove();box.appendChild(line);
}
function syncExtraSelectOptions(){
  document.querySelectorAll('.supplier-extra-category').forEach(sel=>{const v=sel.value;sel.innerHTML=optionsHtml(v)})
}
function selectedCategoryIds(){
  const ids=[];const primary=Number($('supplierCategory')?.value)||0;if(primary)ids.push(primary);
  document.querySelectorAll('.supplier-extra-category').forEach(s=>{const id=Number(s.value)||0;if(id&&!ids.includes(id))ids.push(id)});
  return ids;
}
async function loadSupplierExtras(supplierId){
  const box=$('supplierExtraCategories');if(!box)return;box.innerHTML='';
  if(!supplierId)return;
  if(!assignments.length)await loadMultiData();
  const primary=Number($('supplierCategory')?.value)||0;
  assignmentsFor(supplierId).filter(a=>Number(a.category_id)!==primary).forEach(a=>addExtraCategory(a.category_id));
}

function attachOpenTracking(){
  document.addEventListener('click',e=>{
    const row=e.target.closest('.spares-row');
    if(row){currentSupplierId=Number(row.dataset.id)||null;setTimeout(()=>loadSupplierExtras(currentSupplierId),80);return}
    if(e.target.closest('#newSupplier')){currentSupplierId=null;setTimeout(()=>loadSupplierExtras(null),80)}
  },true);
}

function wrapSave(){
  if(saveWrapped)return;const btn=$('saveSupplier');if(!btn?.onclick)return;
  const original=btn.onclick;
  btn.onclick=async function(e){
    const wanted=selectedCategoryIds();
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
    if(supplierId){await saveAssignments(supplierId,wanted);currentSupplierId=supplierId;await loadMultiData()}
  };
  saveWrapped=true;
}

async function saveAssignments(supplierId,categoryIds){
  const {error:de}=await sb.from('supplier_category_assignments').delete().eq('supplier_id',supplierId);if(de){alert('No se pudieron actualizar los rubros: '+de.message);return}
  if(!categoryIds.length)return;
  const rows=categoryIds.map((categoryId,i)=>({supplier_id:supplierId,category_id:categoryId,is_primary:i===0}));
  const {error}=await sb.from('supplier_category_assignments').insert(rows);if(error)alert('No se pudieron guardar todos los rubros: '+error.message)
}

function categoryBadge(c,primary=false){
  if(!c)return '';
  return `<span style="display:inline-block;background:${primary?'#d81f26':'#2d2d32'};color:#fff;padding:4px 9px;border-radius:999px;font-weight:700;margin:2px 4px 2px 0">${esc(c.name)}${primary?'':' · adicional'}</span>`
}
function patchRows(){
  document.querySelectorAll('.spares-row').forEach(row=>{
    const id=Number(row.dataset.id);const list=assignmentsFor(id);if(!list.length)return;
    const cell=row.children[4];if(!cell)return;
    const sorted=[...list].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary));
    cell.innerHTML=sorted.map(a=>categoryBadge(categoryById(a.category_id),a.is_primary)).join('');
  })
}

function applyOwnFilters(){
  const q=norm($('supplierSearch')?.value||'');const cat=Number($('categoryFilter')?.value)||0;
  document.querySelectorAll('.spares-row').forEach(row=>{
    const id=Number(row.dataset.id);const own=norm(row.textContent);const ct=norm(categoryTextFor(id));
    const qOk=!q||own.includes(q)||ct.includes(q);
    const catOk=!cat||assignmentsFor(id).some(a=>Number(a.category_id)===cat);
    row.style.display=qOk&&catOk?'':'none';
  })
}
function patchRowsAndFilter(){if(rendering)return;rendering=true;try{patchRows();applyOwnFilters()}finally{rendering=false}}

function wrapFilters(){
  if(filtersWrapped)return;
  const search=$('supplierSearch'),cf=$('categoryFilter');
  if(search?.oninput){const original=search.oninput;search.oninput=function(e){const v=this.value;this.value='';original.call(this,e);this.value=v;setTimeout(patchRowsAndFilter,40)}}
  if(cf?.onchange){const original=cf.onchange;cf.onchange=function(e){const v=this.value;this.value='';original.call(this,e);this.value=v;setTimeout(patchRowsAndFilter,40)}}
  filtersWrapped=true;
}
function observeRows(){
  const lists=$('supplierLists');if(lists&&!lists.dataset.multiCategoriesObserved){lists.dataset.multiCategoriesObserved='1';new MutationObserver(()=>setTimeout(patchRowsAndFilter,50)).observe(lists,{childList:true,subtree:true})}
}

function boot(){
  if(ensureUI())return;
  const o=new MutationObserver(()=>{if(ensureUI())o.disconnect()});o.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>ensureUI(),700);
}
boot();
