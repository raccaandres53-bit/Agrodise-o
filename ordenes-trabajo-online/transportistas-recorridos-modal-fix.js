const $=id=>document.getElementById(id);

function attachRouteModalFix(){
  const close=$('closeRoutes');
  if(!close||close.dataset.routeModalStable==='1')return false;
  close.dataset.routeModalStable='1';
  const original=close.onclick;
  close.onclick=e=>{
    if(e && e.isTrusted===false)return;
    if(typeof original==='function')return original.call(close,e);
    $('routeModal')?.classList.remove('show');
  };
  return true;
}

const obs=new MutationObserver(()=>attachRouteModalFix());
obs.observe(document.body,{childList:true,subtree:true});
attachRouteModalFix();
