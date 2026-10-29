import { sb } from './supabase-client.js';

const BUCKET='knowledge-media';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
let editorLoadToken=0;
let runnerLoadToken=0;

function ensureCss(){
  if(document.querySelector('link[href*="conocimiento-media.css"]'))return;
  const l=document.createElement('link');
  l.rel='stylesheet';l.href='./conocimiento-media.css?v=20261029-1505';
  document.head.appendChild(l);
}

async function signedUrl(path){
  const {data,error}=await sb.storage.from(BUCKET).createSignedUrl(path,3600);
  if(error)throw error;
  return data?.signedUrl||'';
}

async function listMedia(stepId){
  const {data,error}=await sb.from('knowledge_step_media').select('*').eq('step_id',stepId).order('created_at');
  if(error)throw error;
  return data||[];
}

function mediaType(file){
  if(file.type.startsWith('image/'))return'image';
  if(file.type.startsWith('video/'))return'video';
  return null;
}

function cleanName(name){return String(name||'archivo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-')}

function ensureEditorPanel(){
  const modal=$('kv5StepModal');
  const form=modal?.querySelector('.kv5-form');
  const save=$('kv5SaveStep');
  if(!modal||!form||!save)return false;
  if(!$('kv5MediaEditor')){
    const panel=document.createElement('div');
    panel.id='kv5MediaEditor';panel.className='kv5-media-editor';
    panel.innerHTML=`<div class="kv5-media-head"><div><b>📷 Vista real / multimedia</b><div class="kv5-sub">Subí la foto real en máxima calidad. No se comprime.</div></div><button id="kv5AddMedia" type="button" class="kv5-btn kv5-dark">+ Foto / video</button></div><input id="kv5MediaFile" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" hidden><label class="kv5-media-caption-label">Descripción opcional<input id="kv5MediaCaption" placeholder="Ej. posición correcta del retén"></label><div id="kv5MediaStatus" class="kv5-sub"></div><div id="kv5MediaGrid" class="kv5-media-grid"></div>`;
    form.insertBefore(panel,save);
    $('kv5AddMedia').onclick=()=>{
      const stepId=Number(modal.dataset.id||0);
      if(!stepId)return alert('Guardá primero el paso. Después volvé a editarlo para agregar la foto real.');
      $('kv5MediaFile').click();
    };
    $('kv5MediaFile').onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      const stepId=Number(modal.dataset.id||0);if(!stepId)return;
      const type=mediaType(file);if(!type)return alert('Formato no admitido.');
      if(file.size>50*1024*1024)return alert('El archivo supera el límite de 50 MB.');
      const status=$('kv5MediaStatus');
      status.textContent='Subiendo archivo original…';
      const path=`steps/${stepId}/${Date.now()}-${cleanName(file.name)}`;
      try{
        const up=await sb.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
        if(up.error)throw up.error;
        const caption=$('kv5MediaCaption').value.trim()||null;
        const ins=await sb.from('knowledge_step_media').insert({step_id:stepId,media_type:type,storage_path:path,caption});
        if(ins.error){await sb.storage.from(BUCKET).remove([path]);throw ins.error}
        $('kv5MediaCaption').value='';e.target.value='';
        status.textContent='Archivo guardado.';
        await renderEditorMedia(stepId);
      }catch(err){console.error(err);status.textContent='';alert('No se pudo guardar la foto/video: '+(err.message||err));}
    };
  }
  return true;
}

async function renderEditorMedia(stepId){
  ensureEditorPanel();
  const token=++editorLoadToken;
  const grid=$('kv5MediaGrid'),status=$('kv5MediaStatus');
  if(!grid||!status)return;
  if(!stepId){grid.innerHTML='';status.textContent='Guardá el paso primero para habilitar fotos y videos.';return}
  status.textContent='Cargando multimedia…';
  try{
    const items=await listMedia(stepId);if(token!==editorLoadToken)return;
    const enriched=await Promise.all(items.map(async m=>({...m,url:await signedUrl(m.storage_path)})));
    if(token!==editorLoadToken)return;
    status.textContent=enriched.length?`${enriched.length} archivo${enriched.length===1?'':'s'} de referencia`:'Todavía no hay foto real para este paso.';
    grid.innerHTML=enriched.map(m=>`<div class="kv5-media-card" data-media-id="${m.id}" data-path="${esc(m.storage_path)}">${m.media_type==='video'?`<video src="${esc(m.url)}" controls preload="metadata"></video>`:`<img src="${esc(m.url)}" alt="${esc(m.caption||'Foto real del paso')}" loading="lazy">`}<div class="kv5-media-card-bottom"><span>${esc(m.caption||'Referencia real')}</span><button type="button" class="kv5-media-delete">Eliminar</button></div></div>`).join('');
    grid.querySelectorAll('img').forEach(img=>img.onclick=()=>showLightbox(img.src,img.alt));
    grid.querySelectorAll('.kv5-media-delete').forEach(btn=>btn.onclick=async()=>{
      const card=btn.closest('.kv5-media-card');if(!card||!confirm('¿Eliminar esta referencia?'))return;
      const id=Number(card.dataset.mediaId),path=card.dataset.path;
      const rem=await sb.storage.from(BUCKET).remove([path]);if(rem.error)return alert(rem.error.message);
      const del=await sb.from('knowledge_step_media').delete().eq('id',id);if(del.error)return alert(del.error.message);
      await renderEditorMedia(stepId);
    });
  }catch(err){console.error(err);status.textContent='No se pudo cargar la multimedia.';}
}

function showLightbox(src,alt='Foto real'){
  let box=$('kv5MediaLightbox');
  if(!box){box=document.createElement('div');box.id='kv5MediaLightbox';box.className='kv5-media-lightbox';box.innerHTML='<button type="button" class="kv5-media-lightbox-close">×</button><img><div class="kv5-media-lightbox-hint">Rueda/pellizco del navegador para ampliar · clic fuera para cerrar</div>';document.body.appendChild(box);box.querySelector('.kv5-media-lightbox-close').onclick=()=>box.classList.remove('show');box.onclick=e=>{if(e.target===box)box.classList.remove('show')}}
  box.querySelector('img').src=src;box.querySelector('img').alt=alt;box.classList.add('show');
}

async function findRunnerStep(){
  const ins=$('kv5Instruction'),title=$('kv5RunnerTitle')?.textContent?.trim();
  if(!ins||!title)return null;
  const txt=ins.querySelector('.kv5-sub')?.textContent||'';
  const pos=Number((txt.match(/PASO\s+(\d+)/i)||[])[1]);
  const stepTitle=ins.querySelector('h2')?.textContent?.trim();
  if(!pos||!stepTitle)return null;
  const {data:procs,error:pErr}=await sb.from('knowledge_procedures').select('id').eq('title',title);
  if(pErr||!procs?.length)return null;
  const ids=procs.map(p=>p.id);
  const {data,error}=await sb.from('knowledge_steps').select('id,procedure_id,position,title').in('procedure_id',ids).eq('position',pos).eq('title',stepTitle).limit(1).maybeSingle();
  if(error)return null;
  return data||null;
}

async function renderRunnerMedia(){
  const ins=$('kv5Instruction');if(!ins)return;
  const token=++runnerLoadToken;
  ins.querySelector('#kv5RunnerReal')?.remove();
  const step=await findRunnerStep();if(!step||token!==runnerLoadToken)return;
  let items=[];try{items=await listMedia(step.id)}catch{return}
  if(token!==runnerLoadToken)return;
  const block=document.createElement('div');block.id='kv5RunnerReal';block.className='kv5-runner-real kv5-section';
  if(!items.length){
    block.innerHTML='<div class="kv5-real-title"><b>📷 Vista real</b><span>Sin foto cargada todavía</span></div><div class="kv5-real-empty">Cuando cargues una foto de esta pieza, aparecerá acá en calidad original para comparar el 3D con la máquina real.</div>';
  }else{
    const enriched=await Promise.all(items.map(async m=>({...m,url:await signedUrl(m.storage_path)})));if(token!==runnerLoadToken)return;
    block.innerHTML=`<div class="kv5-real-title"><b>📷 Vista real</b><span>${enriched.length} referencia${enriched.length===1?'':'s'}</span></div><div class="kv5-runner-media-grid">${enriched.map(m=>m.media_type==='video'?`<figure><video src="${esc(m.url)}" controls playsinline preload="metadata"></video>${m.caption?`<figcaption>${esc(m.caption)}</figcaption>`:''}</figure>`:`<figure><img src="${esc(m.url)}" alt="${esc(m.caption||'Vista real')}" loading="eager">${m.caption?`<figcaption>${esc(m.caption)}</figcaption>`:''}</figure>`).join('')}</div>`;
    block.querySelectorAll('img').forEach(img=>img.onclick=()=>showLightbox(img.src,img.alt));
  }
  const actions=ins.querySelector('.kv5-runner-actions');
  if(actions)ins.insertBefore(block,actions);else ins.appendChild(block);
}

function setup(){
  ensureCss();
  const modal=$('kv5StepModal'),ins=$('kv5Instruction');
  if(!modal||!ins)return false;
  ensureEditorPanel();
  const modalObs=new MutationObserver(()=>{if(modal.classList.contains('show'))setTimeout(()=>renderEditorMedia(Number(modal.dataset.id||0)),0)});
  modalObs.observe(modal,{attributes:true,attributeFilter:['class']});
  const insObs=new MutationObserver(()=>{if($('kv5Runner')?.classList.contains('show'))queueMicrotask(renderRunnerMedia)});
  insObs.observe(ins,{childList:true});
  return true;
}

let tries=0;const timer=setInterval(()=>{tries++;if(setup()||tries>80)clearInterval(timer)},250);
