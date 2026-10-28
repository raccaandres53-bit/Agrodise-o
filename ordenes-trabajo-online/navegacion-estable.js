function goModuleHome(){
  document.getElementById('sparesApp')?.classList.add('hidden');
  document.getElementById('carriersApp')?.classList.add('hidden');
  document.getElementById('transportApp')?.classList.add('hidden');
  document.getElementById('shell')?.classList.add('hidden');
  document.getElementById('knowledgeApp')?.classList.remove('show');
  document.getElementById('modulePicker')?.classList.remove('hidden');
}

function makeHomeButton(id){
  const button=document.createElement('button');
  button.id=id;
  button.type='button';
  button.className='btn dark';
  button.textContent='🏠 Inicio';
  button.style.whiteSpace='nowrap';
  button.onclick=goModuleHome;
  return button;
}

function mountHomeButtons(){
  const sparesActions=document.querySelector('#sparesApp .spares-toolbar-actions');
  if(sparesActions&&!document.getElementById('sparesHomeTop')){
    sparesActions.prepend(makeHomeButton('sparesHomeTop'));
  }

  const carriersActions=document.querySelector('#carriersApp .spares-toolbar-actions');
  if(carriersActions&&!document.getElementById('carriersHomeTop')){
    carriersActions.prepend(makeHomeButton('carriersHomeTop'));
  }
}

mountHomeButtons();
[100,300,700,1500].forEach(ms=>setTimeout(mountHomeButtons,ms));
