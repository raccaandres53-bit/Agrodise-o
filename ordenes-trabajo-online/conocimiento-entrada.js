function addKnowledgeLauncher(){
  const cards=document.querySelector('#modulePicker .module-cards');
  if(!cards||document.getElementById('goKnowledgeLauncher')||document.getElementById('goKnowledge'))return false;

  const btn=document.createElement('button');
  btn.className='module-card';
  btn.id='goKnowledgeLauncher';
  btn.innerHTML='<div class="module-icon">🧠</div><div class="module-name">Conocimiento</div><div class="module-desc">Modelos 3D, despiece, fallas, controles y procedimientos del taller.</div>';

  btn.onclick=async()=>{
    if(btn.dataset.loading==='1')return;
    btn.dataset.loading='1';
    const original=btn.innerHTML;
    btn.innerHTML='<div class="module-icon">⏳</div><div class="module-name">Cargando...</div><div class="module-desc">Preparando el visor 3D.</div>';
    try{
      btn.remove();
      await import('./conocimiento-v4.js?v=20261028-0085');
      await import('./conocimiento-eliminar.js?v=20261028-0085');
      const real=document.getElementById('goKnowledge');
      if(!real)throw new Error('No se pudo iniciar el módulo de Conocimiento.');
      real.click();
    }catch(err){
      console.error('Error al iniciar Conocimiento',err);
      alert('No se pudo abrir Conocimiento. Los demás módulos no fueron afectados.');
      if(!document.getElementById('goKnowledgeLauncher')&&!document.getElementById('goKnowledge')){
        btn.innerHTML=original;
        btn.dataset.loading='0';
        cards.appendChild(btn);
      }
    }
  };

  cards.appendChild(btn);
  return true;
}

if(!addKnowledgeLauncher()){
  const observer=new MutationObserver(()=>{
    if(addKnowledgeLauncher())observer.disconnect();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>addKnowledgeLauncher(),700);
}
