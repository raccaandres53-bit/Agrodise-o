import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);

// La planilla impresa/PDF usa Arial independientemente de la fuente de la interfaz.
const printStyle=document.createElement('style');
printStyle.textContent='@media print{.print,.print *{font-family:Arial,Helvetica,sans-serif!important}}';
document.head.appendChild(printStyle);

const status=$('status');
if(status && ![...status.options].some(o=>o.value==='Entregada')){
  const opt=document.createElement('option');
  opt.value='Entregada';
  opt.textContent='Entregada';
  status.appendChild(opt);
}

const actions=document.querySelector('.acts');
const deliveredBtn=document.createElement('button');
deliveredBtn.id='deliveredBtn';
deliveredBtn.className='btn';
deliveredBtn.textContent='✓ Ya se entregó';
deliveredBtn.style.background='#178a49';
deliveredBtn.style.color='#fff';
deliveredBtn.style.display='none';
if(actions) actions.insertBefore(deliveredBtn,$('printBtn'));

function showToast(msg){
  const t=$('toast');
  if(!t){alert(msg);return}
  t.textContent=msg;
  t.classList.remove('hidden');
  setTimeout(()=>t.classList.add('hidden'),2600);
}

function currentOrderId(){
  const m=($('code')?.textContent||'').match(/OT-(\d+)/);
  return m?Number(m[1]):null;
}

function syncDeliveryButton(){
  if(!status||!deliveredBtn)return;
  deliveredBtn.style.display=status.value==='Lista para entregar'&&!!currentOrderId()?'':'none';
}

async function refreshActiveOrders(){
  const shell=$('shell');
  if(!shell||shell.classList.contains('hidden'))return;
  const {data,error}=await supabase.from('orders').select('id,status');
  if(error||!data)return;
  const delivered=new Set(data.filter(o=>o.status==='Entregada').map(o=>String(o.id)));
  document.querySelectorAll('#olist .order').forEach(el=>{
    el.style.display=delivered.has(el.dataset.id)?'none':'';
  });
  document.querySelectorAll('#olist .delivered-empty').forEach(el=>el.remove());
  const visible=[...document.querySelectorAll('#olist .order')].filter(el=>el.style.display!=='none');
  if(!visible.length && $('olist')){
    const empty=document.createElement('div');
    empty.className='empty delivered-empty';
    empty.textContent='No hay órdenes activas para mostrar.';
    $('olist').appendChild(empty);
  }
  if($('sp')) $('sp').textContent=data.filter(o=>o.status==='Pendiente').length;
  if($('si')) $('si').textContent=data.filter(o=>o.status==='En proceso').length;
  if($('sd')) $('sd').textContent=data.filter(o=>o.status==='Lista para entregar').length;
  if($('st')) $('st').textContent=data.filter(o=>o.status!=='Entregada').length;
}

deliveredBtn.onclick=async()=>{
  const id=currentOrderId();
  if(!id)return;
  if(!confirm('¿Confirmar que esta orden ya fue entregada al cliente?'))return;
  deliveredBtn.disabled=true;
  deliveredBtn.textContent='Guardando...';
  const {error}=await supabase.from('orders').update({status:'Entregada',delivered_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);
  if(error){
    deliveredBtn.disabled=false;
    deliveredBtn.textContent='✓ Ya se entregó';
    showToast('No se pudo marcar como entregada: '+error.message);
    return;
  }
  status.value='Entregada';
  syncDeliveryButton();
  showToast('Orden marcada como entregada');
  setTimeout(()=>location.reload(),650);
};

status?.addEventListener('change',syncDeliveryButton);
$('saveBtn')?.addEventListener('click',()=>setTimeout(syncDeliveryButton,800));
$('newBtn')?.addEventListener('click',()=>setTimeout(syncDeliveryButton,50));
$('olist')?.addEventListener('click',()=>setTimeout(syncDeliveryButton,500),true);

const ordersObserver=new MutationObserver(()=>refreshActiveOrders());
if($('olist')) ordersObserver.observe($('olist'),{childList:true});
setInterval(syncDeliveryButton,500);
setTimeout(refreshActiveOrders,900);
