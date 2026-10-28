import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const sb=createClient('https://dcmlbriqiybegmwanwlf.supabase.co','sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const BUCKET='knowledge-models';
let decorating=false;

function activeAssetId(){
  const active=document.querySelector('#knowledgeAssetList .knowledge-item.active[data-id]');
  return Number(active?.dataset.id)||0;
}

async function decoratePointDeletes(){
  if(decorating)return;
  const list=$('knowledgePointList');
  const assetId=activeAssetId();
  if(!list||!assetId)return;
  decorating=true;
  try{
    const {data,error}=await sb.from('knowledge_points').select('id,title,created_at').eq('asset_id',assetId).order('created_at',{ascending:false});
    if(error)return;
    const cards=[...list.querySelectorAll('.knowledge-point')];
    cards.forEach((card,i)=>{
      if(card.querySelector('.knowledge-delete-point-v5'))return;
      const row=data?.[i];
      if(!row)return;
      const wrap=document.createElement('div');
      wrap.style.cssText='margin-top:9px;display:flex;justify-content:flex-end';
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='knowledge-btn dark knowledge-delete-point-v5';
      btn.style.cssText='padding:6px 10px;background:#48191d;color:#fff';
      btn.textContent='Eliminar';
      btn.onclick=async()=>{
        if(!confirm(`¿Eliminar el punto técnico “${row.title||'Sin título'}”?`))return;
        btn.disabled=true;
        const {error:delError}=await sb.from('knowledge_points').delete().eq('id',row.id);
        if(delError){alert('No se pudo eliminar el punto: '+delError.message);btn.disabled=false;return}
        card.remove();
      };
      wrap.appendChild(btn);
      card.appendChild(wrap);
    });
  } finally {decorating=false;}
}

function ensureDeleteModelButton(){
  if($('knowledgeDeleteModel'))return true;
  const load=$('knowledgeLoadModel');
  if(!load)return false;
  const btn=document.createElement('button');
  btn.type='button';
  btn.id='knowledgeDeleteModel';
  btn.className='knowledge-btn dark';
  btn.style.cssText='background:#48191d;color:#fff';
  btn.textContent='Eliminar modelo';
  btn.onclick=deleteCurrentModel;
  load.insertAdjacentElement('afterend',btn);
  return true;
}

async function deleteCurrentModel(){
  const assetId=activeAssetId();
  if(!assetId){alert('Primero seleccioná una ficha.');return}
  const {data:asset,error}=await sb.from('knowledge_assets').select('id,name,model_file_name,model_storage_path').eq('id',assetId).single();
  if(error){alert('No se pudo leer la ficha: '+error.message);return}
  if(!asset?.model_storage_path){alert('Esta ficha no tiene un modelo guardado.');return}
  if(!confirm(`¿Eliminar el modelo 3D de “${asset.name}”?\n\nSe borrará el archivo GLB guardado.`))return;
  const btn=$('knowledgeDeleteModel');
  if(btn)btn.disabled=true;
  const {error:storageError}=await sb.storage.from(BUCKET).remove([asset.model_storage_path]);
  if(storageError){alert('No se pudo borrar el GLB: '+storageError.message);if(btn)btn.disabled=false;return}
  const {error:updateError}=await sb.from('knowledge_assets').update({model_file_name:null,model_storage_path:null,updated_at:new Date().toISOString()}).eq('id',assetId);
  if(updateError){alert('El GLB se borró, pero no se pudo limpiar la ficha: '+updateError.message);if(btn)btn.disabled=false;return}
  const status=$('knowledgeModelStatus');
  if(status)status.textContent='Modelo eliminado. Podés cargar otro GLB cuando quieras.';
  const empty=$('knowledgeViewerEmpty');
  if(empty){empty.style.display='grid';empty.innerHTML='<div><div style="font-size:42px">🧩</div><b>Modelo eliminado</b></div>';}
  const selected=document.querySelector('#knowledgeAssetList .knowledge-item.active .knowledge-sub:last-child');
  if(selected?.textContent?.includes('Modelo guardado'))selected.remove();
  alert('Modelo 3D eliminado correctamente.');
  if(btn)btn.disabled=false;
}

function boot(){
  ensureDeleteModelButton();
  decoratePointDeletes();
  const obs=new MutationObserver(()=>{
    ensureDeleteModelButton();
    decoratePointDeletes();
  });
  obs.observe(document.body,{childList:true,subtree:true});
}

boot();
