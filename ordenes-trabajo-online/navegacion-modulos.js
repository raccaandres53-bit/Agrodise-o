function makeHomeButton(id, targetSwitchId){
  const btn=document.createElement('button');
  btn.id=id;
  btn.type='button';
  btn.className='btn dark module-home-btn';
  btn.innerHTML='🏠 Inicio';
  btn.addEventListener('click',()=>document.getElementById(targetSwitchId)?.click());
  return btn;
}

function injectStyles(){
  if(document.getElementById('moduleHomeStyles'))return;
  const st=document.createElement('style');
  st.id='moduleHomeStyles';
  st.textContent=`
    .module-home-btn{white-space:nowrap}
    @media(max-width:700px){
      .spares-toolbar{align-items:flex-start;gap:12px;flex-wrap:wrap}
      .spares-toolbar-actions{width:100%;display:flex;gap:8px;flex-wrap:wrap}
      .spares-toolbar-actions .module-home-btn{order:-1;flex:1;min-width:110px}
    }
  `;
  document.head.appendChild(st);
}

function ensureNav(){
  injectStyles();
  const sparesActions=document.querySelector('#sparesApp .spares-toolbar-actions');
  if(sparesActions && !document.getElementById('sparesTopHome')){
    sparesActions.prepend(makeHomeButton('sparesTopHome','sparesSwitch'));
  }
  const carriersActions=document.querySelector('#carriersApp .spares-toolbar-actions');
  if(carriersActions && !document.getElementById('carriersTopHome')){
    carriersActions.prepend(makeHomeButton('carriersTopHome','carriersSwitch'));
  }
  return !!(document.getElementById('sparesTopHome')&&document.getElementById('carriersTopHome'));
}

if(!ensureNav()){
  const observer=new MutationObserver(()=>{if(ensureNav())observer.disconnect()});
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(ensureNav,800);
}
