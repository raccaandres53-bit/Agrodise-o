const $=id=>document.getElementById(id);

function installCarrierModalGuard(){
  const modal=$('carrierModal');
  if(!modal||modal.dataset.guardInstalled==='1')return false;
  modal.dataset.guardInstalled='1';
  let intentionalClose=false;
  let wasOpen=modal.classList.contains('show');

  const allowClose=()=>{intentionalClose=true;setTimeout(()=>{intentionalClose=false},1200)};
  ['closeCarrier','cancelCarrier','saveCarrier','deleteCarrier','carriersSwitch','carriersLogout'].forEach(id=>{
    $(id)?.addEventListener('click',allowClose,true);
  });

  modal.addEventListener('click',e=>{
    if(e.target===modal){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },true);

  new MutationObserver(()=>{
    const isOpen=modal.classList.contains('show');
    if(wasOpen&&!isOpen&&!intentionalClose){
      modal.classList.add('show');
    }
    wasOpen=modal.classList.contains('show');
  }).observe(modal,{attributes:true,attributeFilter:['class']});

  return true;
}

if(!installCarrierModalGuard()){
  const obs=new MutationObserver(()=>{if(installCarrierModalGuard())obs.disconnect()});
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>installCarrierModalGuard(),600);
}
