let deferredPrompt=null;
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid=()=>/android/i.test(navigator.userAgent);

function ensurePwaHead(){
  if(!document.querySelector('link[href*="taller-mobile-cards.css"]')){
    const mobile=document.createElement('link');mobile.rel='stylesheet';mobile.href='./taller-mobile-cards.css?v=20261028-1135';document.head.appendChild(mobile);
  }
  if(!document.querySelector('link[rel="manifest"]')){
    const manifest=document.createElement('link');manifest.rel='manifest';manifest.href='./manifest.webmanifest';document.head.appendChild(manifest);
  }
  if(!document.querySelector('meta[name="mobile-web-app-capable"]')){
    const m=document.createElement('meta');m.name='mobile-web-app-capable';m.content='yes';document.head.appendChild(m);
  }
  if(!document.querySelector('meta[name="apple-mobile-web-app-capable"]')){
    const m=document.createElement('meta');m.name='apple-mobile-web-app-capable';m.content='yes';document.head.appendChild(m);
  }
  if(!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')){
    const m=document.createElement('meta');m.name='apple-mobile-web-app-status-bar-style';m.content='black-translucent';document.head.appendChild(m);
  }
  if(!document.querySelector('meta[name="apple-mobile-web-app-title"]')){
    const m=document.createElement('meta');m.name='apple-mobile-web-app-title';m.content='AgroDiseño';document.head.appendChild(m);
  }
  if(!document.querySelector('link[rel="apple-touch-icon"]')){
    const icon=document.createElement('link');icon.rel='apple-touch-icon';icon.href='./pwa-icon-192.svg';document.head.appendChild(icon);
  }
}

function injectStyles(){
  if(document.getElementById('pwaInstallStyles'))return;
  const st=document.createElement('style');
  st.id='pwaInstallStyles';
  st.textContent=`
    .pwa-install-wrap{margin-top:18px;display:flex;justify-content:center}
    .pwa-install-btn{border:1px solid #3a3a40;background:#18181c;color:#fff;border-radius:12px;padding:12px 16px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:9px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
    .pwa-install-btn:hover{border-color:#d51f27;background:#1e1e23}
    .pwa-install-btn .pwa-install-icon{font-size:19px}
    @media(max-width:700px){.pwa-install-wrap{margin-top:14px}.pwa-install-btn{width:100%;justify-content:center;padding:13px 14px}}
  `;
  document.head.appendChild(st);
}

function showIOSHelp(){
  alert('Para agregar AgroDiseño al inicio en iPhone/iPad:\n\n1. Abrí esta página en Safari.\n2. Tocá Compartir.\n3. Elegí “Añadir a pantalla de inicio”.\n4. Tocá “Añadir”.');
}
function showAndroidHelp(){
  alert('Si no aparece la instalación automática:\n\n1. Abrí el menú ⋮ de Chrome.\n2. Elegí “Instalar app” o “Añadir a pantalla principal”.');
}

async function installApp(){
  if(isStandalone())return;
  if(deferredPrompt){
    const p=deferredPrompt;
    deferredPrompt=null;
    await p.prompt();
    await p.userChoice.catch(()=>null);
    syncButton();
    return;
  }
  if(isIOS()){showIOSHelp();return;}
  if(isAndroid()){showAndroidHelp();return;}
  alert('En tu navegador podés instalar AgroDiseño desde el menú usando “Instalar app” o “Añadir a pantalla de inicio”.');
}

function syncButton(){
  const btn=document.getElementById('pwaInstallBtn');
  if(!btn)return;
  btn.style.display=isStandalone()?'none':'';
}

function ensureButton(){
  const picker=document.getElementById('modulePicker');
  const box=picker?.querySelector('.module-picker-box');
  if(!box||document.getElementById('pwaInstallBtn'))return false;
  injectStyles();
  const wrap=document.createElement('div');
  wrap.className='pwa-install-wrap';
  wrap.innerHTML='<button id="pwaInstallBtn" class="pwa-install-btn" type="button"><span class="pwa-install-icon">⬇️</span><span>Añadir AgroDiseño al inicio</span></button>';
  box.appendChild(wrap);
  document.getElementById('pwaInstallBtn').addEventListener('click',installApp);
  syncButton();
  return true;
}

ensurePwaHead();
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredPrompt=e;
  ensureButton();
  syncButton();
});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;syncButton();});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Service worker no disponible',err)));
}

if(!ensureButton()){
  const obs=new MutationObserver(()=>{if(ensureButton())obs.disconnect()});
  obs.observe(document.body,{childList:true,subtree:true});
}
