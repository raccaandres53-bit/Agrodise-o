import { sb } from './supabase-client.js';
let canKnowledge=false;

async function loadPermission(){
  const {data:{session}}=await sb.auth.getSession();
  const email=session?.user?.email?.toLowerCase();
  if(!email){canKnowledge=false;return false}
  const {data,error}=await sb.from('allowed_users').select('can_conocimiento').eq('email',email).maybeSingle();
  canKnowledge=!error&&!!data?.can_conocimiento;
  return canKnowledge;
}

function removeKnowledgeCards(){
  document.getElementById('goKnowledgeLauncher')?.remove();
  document.getElementById('goKnowledge')?.remove();
}

function addKnowledgeLauncher(){
  if(!canKnowledge){removeKnowledgeCards();return false}
  const cards=document.querySelector('#modulePicker .module-cards');
  if(!cards||document.getElementById('goKnowledgeLauncher')||document.getElementById('goKnowledge'))return false;

  const btn=document.createElement('button');
  btn.className='module-card';
  btn.id='goKnowledgeLauncher';
  btn.innerHTML='<div class="module-icon">🧠</div><div class="module-name">Conocimiento</div><div class="module-desc">Instructivos interactivos, capacitación y experiencia del taller.</div>';

  btn.onclick=async()=>{
    if(!canKnowledge){alert('No tenés permiso para ingresar a Conocimiento.');return}
    if(btn.dataset.loading==='1')return;
    btn.dataset.loading='1';
    const original=btn.innerHTML;
    btn.innerHTML='<div class="module-icon">⏳</div><div class="module-name">Cargando...</div><div class="module-desc">Preparando procedimientos y visor 3D.</div>';
    try{
      btn.remove();
      await import('./conocimiento-v5.js?v=20261028-1215');
      await import('./conocimiento-media.js?v=20261029-1505');
      await import('./conocimiento-visual-pro.js?v=20261029-1635');
      const real=document.getElementById('goKnowledge');
      if(!real)throw new Error('No se pudo iniciar el módulo de Conocimiento.');
      real.click();
    }catch(err){
      console.error('Error al iniciar Conocimiento',err);
      alert('No se pudo abrir Conocimiento. Los demás módulos no fueron afectados.');
      if(canKnowledge&&!document.getElementById('goKnowledgeLauncher')&&!document.getElementById('goKnowledge')){
        btn.innerHTML=original;
        btn.dataset.loading='0';
        cards.appendChild(btn);
      }
    }
  };

  cards.appendChild(btn);
  return true;
}

async function boot(){
  await loadPermission();
  if(!canKnowledge){removeKnowledgeCards();return}
  if(!addKnowledgeLauncher()){
    const observer=new MutationObserver(()=>{
      if(!canKnowledge){observer.disconnect();removeKnowledgeCards();return}
      if(addKnowledgeLauncher())observer.disconnect();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>addKnowledgeLauncher(),700);
  }
}
boot();

sb.auth.onAuthStateChange(async()=>{
  await loadPermission();
  if(canKnowledge)addKnowledgeLauncher();else removeKnowledgeCards();
});
