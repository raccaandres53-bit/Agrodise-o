import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const defaults=["Barra de mando","Monitor","Cable de alimentación","Cilindro hidráulico","Cubiertas","Cuchillas","Capot trasero","Sin fin","Motor hidráulico","Mangueras hidráulicas","Gatos"];
let current=null,cache=[],role=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
function toast(msg){$("toast").textContent=msg;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),2600)}
function setLoginMsg(msg,bad=false){$("loginMsg").textContent=msg;$("loginMsg").style.color=bad?"#ff9fa4":"#bbb"}
function badge(s){return s==="Pendiente"?"bpend":s==="En proceso"?"bproc":"bdone"}
function fmtDate(s){if(!s)return"";const [y,m,d]=s.split("-");return `${d}/${m}/${y}`}

async function ensureAccess(session){
  if(!session){showLogin();return false}
  const {data,error}=await supabase.from("allowed_users").select("email,role").maybeSingle();
  if(error||!data){await supabase.auth.signOut();showLogin();setLoginMsg("Tu cuenta existe, pero este correo no está autorizado para ingresar.",true);return false}
  role=data.role;$("userEmail").textContent=session.user.email||data.email;showApp();await load();return true
}
function showLogin(){$("login").classList.remove("hidden");$("shell").classList.add("hidden")}
function showApp(){$("login").classList.add("hidden");$("shell").classList.remove("hidden")}
async function login(){
  const email=$("loginEmail").value.trim(),password=$("loginPassword").value;
  if(!email||!password){setLoginMsg("Completá email y contraseña.",true);return}
  setLoginMsg("Ingresando...");
  const {data,error}=await supabase.auth.signInWithPassword({email,password});
  if(error){setLoginMsg(error.message,true);return}
  await ensureAccess(data.session);
}
async function signup(){
  const email=$("loginEmail").value.trim(),password=$("loginPassword").value;
  if(!email||password.length<6){setLoginMsg("Ingresá un email y una contraseña de al menos 6 caracteres.",true);return}
  setLoginMsg("Creando cuenta...");
  const {data,error}=await supabase.auth.signUp({email,password});
  if(error){setLoginMsg(error.message,true);return}
  if(data.session){await ensureAccess(data.session)}
  else setLoginMsg("Cuenta creada. Revisá tu correo para confirmar el acceso y luego volvé a iniciar sesión.");
}
$("loginBtn").onclick=login;$("signupBtn").onclick=signup;$("loginPassword").addEventListener("keydown",e=>{if(e.key==="Enter")login()});
$("logoutBtn").onclick=async()=>{await supabase.auth.signOut();showLogin();setLoginMsg("Sesión cerrada.")};

async function load(){
  const {data:orders,error}=await supabase.from("orders").select("*").order("id",{ascending:false});
  if(error){toast("Error cargando órdenes: "+error.message);return}
  const {data:tasks}=await supabase.from("tasks").select("order_id,status");
  const counts={};
  (tasks||[]).forEach(t=>{counts[t.order_id]??={total:0,done:0};counts[t.order_id].total++;if(t.status==="Terminado")counts[t.order_id].done++});
  cache=(orders||[]).map(o=>({...o,task_count:counts[o.id]?.total||0,task_done:counts[o.id]?.done||0}));
  render();
}
function render(){
  let q=$("q").value.toLowerCase(),d=cache.filter(o=>(o.client+" "+o.machine+" "+o.model).toLowerCase().includes(q));
  $("sp").textContent=cache.filter(x=>x.status==="Pendiente").length;$("si").textContent=cache.filter(x=>x.status==="En proceso").length;$("sd").textContent=cache.filter(x=>x.status==="Lista para entregar").length;$("st").textContent=cache.length;
  $("olist").innerHTML=d.length?d.map(o=>`<div class="order" data-id="${o.id}"><b>OT-${String(o.id).padStart(4,"0")}</b><div><b>${esc(o.client)}</b><div class="sub">${esc(o.machine)}</div></div><div class="sub">${o.task_count?o.task_done+" / "+o.task_count+" trabajos terminados":"Sin trabajos cargados"}</div><span class="badge ${badge(o.status)}">● ${esc(o.status)}</span><div class="sub">${fmtDate(o.date_in)}</div></div>`).join(""):`<div class="empty">No hay órdenes para mostrar.</div>`;
  document.querySelectorAll(".order").forEach(x=>x.onclick=()=>editOrder(+x.dataset.id));
}
$("q").oninput=render;
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));$(b.dataset.v).classList.add("active");if(b.dataset.v==="clients")loadClients();if(b.dataset.v==="machines")loadMachines();if(b.dataset.v==="history")loadHistory()});
function loadClients(){
 const m=new Map();cache.forEach(o=>{let k=o.client.trim();if(!k)return;let x=m.get(k)||{orders:0,last:""};x.orders++;if((o.date_in||"")>x.last)x.last=o.date_in||"";m.set(k,x)});
 $("clientsBox").innerHTML=`<table class="table"><thead><tr><th>Cliente</th><th>Órdenes</th><th>Último ingreso</th></tr></thead><tbody>${[...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,x])=>`<tr><td><b>${esc(k)}</b></td><td>${x.orders}</td><td>${fmtDate(x.last)}</td></tr>`).join("")}</tbody></table>`;
}
function loadMachines(){
 const m=new Map();cache.forEach(o=>{let k=[o.machine,o.model,o.client].join("|");if(!o.machine.trim())return;let x=m.get(k)||{...o,visits:0,last:""};x.visits++;if((o.date_in||"")>x.last)x.last=o.date_in||"";m.set(k,x)});
 $("machinesBox").innerHTML=`<table class="table"><thead><tr><th>Máquina</th><th>Modelo</th><th>Cliente</th><th>Ingresos</th><th>Último</th></tr></thead><tbody>${[...m.values()].sort((a,b)=>a.machine.localeCompare(b.machine)).map(x=>`<tr><td><b>${esc(x.machine)}</b></td><td>${esc(x.model||"")}</td><td>${esc(x.client||"")}</td><td>${x.visits}</td><td>${fmtDate(x.last)}</td></tr>`).join("")}</tbody></table>`;
}
function loadHistory(){$("historyBox").innerHTML=`<table class="table"><thead><tr><th>OT</th><th>Fecha</th><th>Cliente</th><th>Máquina</th><th>Estado</th></tr></thead><tbody>${cache.map(o=>`<tr data-id="${o.id}" style="cursor:pointer"><td>OT-${String(o.id).padStart(4,"0")}</td><td>${fmtDate(o.date_in)}</td><td>${esc(o.client)}</td><td>${esc(o.machine)}</td><td>${esc(o.status)}</td></tr>`).join("")}</tbody></table>`;document.querySelectorAll("#historyBox tr[data-id]").forEach(x=>x.onclick=()=>editOrder(+x.dataset.id))}

function newOrder(){
 current=null;$("mt").textContent="Nueva reparación";$("code").textContent="Se asignará número al guardar";["client","machine","model","serial","operator","observations"].forEach(x=>$(x).value="");$("date_in").value=new Date().toISOString().slice(0,10);$("status").value="Pendiente";$("tasks").innerHTML=$("checks").innerHTML=$("parts").innerHTML="";defaults.forEach((x,i)=>addCheck({item:x,condition:"Revisar",comment:"",position:i}));addTask();$("del").style.display="none";$("photos").innerHTML="";$("photoHint").style.display="";$("modal").classList.add("show")
}
async function editOrder(id){
 const [{data:o,error},{data:tasks},{data:checks},{data:parts},{data:photos}]=await Promise.all([
  supabase.from("orders").select("*").eq("id",id).single(),
  supabase.from("tasks").select("*").eq("order_id",id).order("position"),
  supabase.from("checklist").select("*").eq("order_id",id).order("position"),
  supabase.from("parts").select("*").eq("order_id",id).order("position"),
  supabase.from("photos").select("*").eq("order_id",id).order("id",{ascending:false})
 ]);
 if(error){toast("No se pudo abrir la orden.");return}
 current=id;$("mt").textContent="Orden de trabajo";$("code").textContent="OT-"+String(id).padStart(4,"0");
 ["client","machine","model","serial","operator","date_in","status","observations"].forEach(k=>$(k).value=o[k]||"");
 $("tasks").innerHTML=$("checks").innerHTML=$("parts").innerHTML="";(tasks||[]).forEach(addTask);(checks||[]).forEach(addCheck);(parts||[]).forEach(addPart);
 await renderPhotos(photos||[]);$("photoHint").style.display="none";$("del").style.display="";$("modal").classList.add("show")
}
function closeM(){$("modal").classList.remove("show")}
function addTask(v={description:"",status:"Pendiente"}){let r=document.createElement("tr");r.innerHTML=`<td><input class="mini td" style="width:100%" value="${esc(v.description)}"></td><td><select class="mini ts"><option>Pendiente</option><option>En proceso</option><option>Terminado</option></select></td><td><button class="mini rm">×</button></td>`;r.querySelector(".ts").value=v.status;r.querySelector(".rm").onclick=()=>r.remove();$("tasks").appendChild(r)}
function addCheck(v={item:"",condition:"Revisar",comment:""}){let r=document.createElement("tr");r.innerHTML=`<td><input class="mini ci" style="width:100%" value="${esc(v.item)}"></td><td><select class="mini cc"><option>Revisar</option><option>OK</option><option>No llegó</option><option>Dañado</option></select></td><td><input class="mini cm" style="width:100%" value="${esc(v.comment)}"></td><td><button class="mini rm">×</button></td>`;r.querySelector(".cc").value=v.condition;r.querySelector(".rm").onclick=()=>r.remove();$("checks").appendChild(r)}
function addPart(v={qty:1,description:"",sector:"Comercial",status:"Pendiente"}){let r=document.createElement("tr");r.innerHTML=`<td><input type="number" min="0" step="1" class="mini pq" style="width:65px" value="${v.qty}"></td><td><input class="mini pd" style="width:100%" value="${esc(v.description)}"></td><td><select class="mini ps"><option>Comercial</option><option>Corte láser</option><option>Plegado</option><option>Mecanizado</option><option>Soldadura</option></select></td><td><select class="mini pst"><option>Pendiente</option><option>Pedido</option><option>Listo</option></select></td><td><button class="mini rm">×</button></td>`;r.querySelector(".ps").value=v.sector||"Comercial";r.querySelector(".pst").value=v.status||"Pendiente";r.querySelector(".rm").onclick=()=>r.remove();$("parts").appendChild(r)}
function collect(){return{client:$("client").value.trim(),machine:$("machine").value.trim(),model:$("model").value.trim(),serial:$("serial").value.trim(),operator:$("operator").value.trim(),date_in:$("date_in").value||null,status:$("status").value,observations:$("observations").value,tasks:[...$("tasks").querySelectorAll("tr")].map((r,i)=>({description:r.querySelector(".td").value.trim(),status:r.querySelector(".ts").value,position:i})).filter(x=>x.description),checklist:[...$("checks").querySelectorAll("tr")].map((r,i)=>({item:r.querySelector(".ci").value.trim(),condition:r.querySelector(".cc").value,comment:r.querySelector(".cm").value.trim(),position:i})).filter(x=>x.item),parts:[...$("parts").querySelectorAll("tr")].map((r,i)=>({qty:+r.querySelector(".pq").value||1,description:r.querySelector(".pd").value.trim(),sector:r.querySelector(".ps").value,status:r.querySelector(".pst").value,position:i})).filter(x=>x.description)}}
async function saveOrder(){
 const b=collect();if(!b.client&&!b.machine){toast("Cargá al menos cliente o máquina.");return}
 const base={client:b.client,machine:b.machine,model:b.model,serial:b.serial,operator:b.operator,date_in:b.date_in,status:b.status,observations:b.observations,updated_at:new Date().toISOString()};
 let oid=current;
 if(!oid){const {data,error}=await supabase.from("orders").insert(base).select("id").single();if(error){toast(error.message);return}oid=data.id;current=oid}
 else {const {error}=await supabase.from("orders").update(base).eq("id",oid);if(error){toast(error.message);return}}
 const dels=await Promise.all(["tasks","checklist","parts"].map(t=>supabase.from(t).delete().eq("order_id",oid)));
 const de=dels.find(x=>x.error)?.error;if(de){toast("Error actualizando detalles: "+de.message);return}
 const inserts=[];if(b.tasks.length)inserts.push(supabase.from("tasks").insert(b.tasks.map(x=>({...x,order_id:oid}))));if(b.checklist.length)inserts.push(supabase.from("checklist").insert(b.checklist.map(x=>({...x,order_id:oid}))));if(b.parts.length)inserts.push(supabase.from("parts").insert(b.parts.map(x=>({...x,order_id:oid}))));
 const res=await Promise.all(inserts);const ie=res.find(x=>x.error)?.error;if(ie){toast("Orden guardada parcialmente: "+ie.message);return}
 await load();await editOrder(oid);toast("Orden guardada")
}
async function delOrder(){
 if(!current||!confirm("¿Eliminar esta orden y sus fotos?"))return;
 const {data:ps}=await supabase.from("photos").select("path").eq("order_id",current);if(ps?.length)await supabase.storage.from("order-photos").remove(ps.map(x=>x.path));
 const {error}=await supabase.from("orders").delete().eq("id",current);if(error){toast(error.message);return}closeM();await load();toast("Orden eliminada")
}
function safeName(n){return n.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]/g,"_")}
async function uploadPhoto(){
 if(!current){toast("Guardá primero la orden.");return}const f=$("photoFile").files[0];if(!f)return;if(f.size>8*1024*1024){toast("Máximo 8 MB por foto.");return}
 const path=`${current}/${crypto.randomUUID()}-${safeName(f.name)}`;const {error:ue}=await supabase.storage.from("order-photos").upload(path,f,{upsert:false,contentType:f.type});if(ue){toast(ue.message);return}
 const {error:de}=await supabase.from("photos").insert({order_id:current,path,original_name:f.name});if(de){await supabase.storage.from("order-photos").remove([path]);toast(de.message);return}
 $("photoFile").value="";await editOrder(current);toast("Foto subida")
}
async function renderPhotos(ps){
 const out=[];for(const p of ps){const {data}=await supabase.storage.from("order-photos").createSignedUrl(p.path,3600);out.push(`<div class="photo"><img src="${esc(data?.signedUrl||"")}" alt=""><div><span class="sub">${esc(p.original_name)}</span><br><button class="mini delphoto" data-id="${p.id}" data-path="${esc(p.path)}">Eliminar</button></div></div>`)}
 $("photos").innerHTML=out.length?out.join(""):"<div class='sub'>Sin fotos cargadas.</div>";document.querySelectorAll(".delphoto").forEach(b=>b.onclick=()=>deletePhoto(+b.dataset.id,b.dataset.path))
}
async function deletePhoto(id,path){if(!confirm("¿Eliminar foto?"))return;await supabase.storage.from("order-photos").remove([path]);await supabase.from("photos").delete().eq("id",id);await editOrder(current)}
function printOrder(){let o=collect(),t=o.tasks.map(x=>`<tr><td>${esc(x.description)}</td><td style="text-align:center">□</td><td></td></tr>`).join("")+Array.from({length:Math.max(4,9-o.tasks.length)},()=>"<tr><td></td><td style='text-align:center'>□</td><td></td></tr>").join(""),c=o.checklist.slice(0,12).map(x=>`<tr><td>${esc(x.item)}</td><td></td><td>${esc(x.comment)}</td></tr>`).join(""),p=o.parts.map(x=>`<tr><td>${x.qty}</td><td>${esc(x.description)}</td><td>${esc(x.sector)}</td><td></td></tr>`).join("")+Array.from({length:Math.max(4,8-o.parts.length)},()=>"<tr><td></td><td></td><td></td><td></td></tr>").join("");$("print").innerHTML=`<div class="ph"><div><div class="pl">AGRO<b>DISEÑO</b></div><div style="font-size:10px">ORDEN DE TRABAJO</div></div><b>OT-${current?String(current).padStart(4,"0"):"____"}</b></div><div style="font-size:11px;line-height:1.7;margin-top:7px"><b>CLIENTE:</b> ${esc(o.client)}<br><b>MÁQUINA:</b> ${esc(o.machine)} &nbsp; <b>MODELO:</b> ${esc(o.model)}<br><b>SERIE:</b> ${esc(o.serial)} &nbsp; <b>OPERARIO:</b> ${esc(o.operator)} &nbsp; <b>FECHA:</b> ${fmtDate(o.date_in)}</div><div class="ttl">TRABAJOS A REALIZAR</div><table class="pt"><tr><th>Trabajo</th><th style="width:50px">Hecho</th><th style="width:210px">Observación / medida</th></tr>${t}</table><div class="ttl">CONTROL DE INGRESO</div><table class="pt"><tr><th>Elemento</th><th style="width:80px">Estado</th><th>Comentario</th></tr>${c}</table><div class="ttl">PIEZAS / REPUESTOS</div><table class="pt"><tr><th style="width:50px">Cant.</th><th>Descripción</th><th style="width:95px">Sector</th><th style="width:55px">Listo</th></tr>${p}</table><div class="ttl">TRABAJOS ENCONTRADOS / ANOTACIONES DE TALLER</div><div class="notes">${esc(o.observations)}</div><div class="sign"><div>FIRMA OPERARIO: ____________________________</div><div>FECHA FINALIZACIÓN: ____________________</div></div>`;window.print()}
async function backup(){
 const [o,t,c,p,ph]=await Promise.all([supabase.from("orders").select("*"),supabase.from("tasks").select("*"),supabase.from("checklist").select("*"),supabase.from("parts").select("*"),supabase.from("photos").select("*")]);
 const data={exported_at:new Date().toISOString(),orders:o.data||[],tasks:t.data||[],checklist:c.data||[],parts:p.data||[],photos:ph.data||[]};const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="AgroDiseno_respaldo_"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)
}

$("newBtn").onclick=newOrder;$("closeBtn").onclick=closeM;$("addTaskBtn").onclick=()=>addTask();$("addCheckBtn").onclick=()=>addCheck();$("addPartBtn").onclick=()=>addPart();$("saveBtn").onclick=saveOrder;$("del").onclick=delOrder;$("printBtn").onclick=printOrder;$("photoBtn").onclick=()=>current?$("photoFile").click():toast("Guardá primero la orden.");$("photoFile").onchange=uploadPhoto;$("backupBtn").onclick=backup;window.onclick=e=>{if(e.target.id==="modal")closeM()};

const {data:{session}}=await supabase.auth.getSession();
if(session)await ensureAccess(session);else showLogin();
supabase.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT")showLogin()});