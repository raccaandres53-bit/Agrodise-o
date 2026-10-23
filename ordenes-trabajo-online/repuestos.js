import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&'"'"/]/g,m=>({'&':'&amp;','"':'&quot;','"':'&quot;','"':'&quot;','"':'&#39;','/':'&#x2F;'}[m]));

function rubroColor(name){
  let h=0;
  if(!name)return '#999';
  for(let i=0;i&lt;name.length;i++){
    h+=name.charCodeAt(i)*((i+1)*7);
  }
  return 'hsl('+((h*269)%360)+',48%,58%)';
}

let suppliers=[],categories=[],editingId=null,pickerShownForSession=false;
let supplierSort={key:'name',dir:'asc'};
let currentView='suppliers';

function buildUI(){
	if($('modulePicker'))return;
	document.body.insertAdjacentHTML('beforeend',`
		&lt;div id="modulePicker" class="module-picker hidden"&gt;
			&lt;div class="module-picker-box"&gt;
				&lt;div class="module-picker-head"&gt;
					&lt;div class="module-picker-logo"&gt;AGRO&lt;b&gt;DISEÑO&lt;/b&gt;&lt;/div&gt;
					&lt;div class="module-picker-title"&gt;¿A qué módulo querés ingresar?&lt;/div&gt;
					&lt;div class="module-picker-sub"&gt;Elegí una opción para continuar.&lt;/div&gt;
				&lt;/div&gt;
				&lt;div class="module-cards"&gt;
					&lt;button class="module-card" id="goWorkshop"&gt;&lt;div class="module-icon"&gt;🛠️&lt;/div&gt;&lt;div class="module-name"&gt;Taller&lt;/div&gt;&lt;div class="module-desc"&gt;Órdenes de trabajo, clientes, máquinas, reparaciones, fotos e historial.&lt;/div&gt;&lt;/button&gt;
					&lt;button class="module-card" id="goSpares"&gt;&lt;div class="module-icon"&gt;⚙️&lt;/div&gt;&lt;div class="module-name"&gt;Repuestos&lt;/div&gt;&lt;div class="module-desc"&gt;Proveedores, emails, direcciones y rubros para compras y abastecimiento.&lt;/div&gt;&lt;/button&gt;
				&lt;/div&gt;
			&lt;/div&gt;
		&lt;/div&gt;

		&lt;div id="sparesApp" class="spares-app hidden"&gt;
			&lt;div class="spares-shell"&gt;
				&lt;aside class="spares-side"&gt;
					&lt;div class="brand"&gt;AGRO&lt;b&gt;DISEÑO&lt;/b&gt;&lt;/div&gt;&lt;div class="sub"&gt;Módulo de repuestos&lt;/div&gt;
					&lt;div class="spares-nav"&gt;&lt;button id="sparesHomeBtn"&gt;▣ Proveedores&lt;/button&gt;&lt;button id="categoriesBtn"&gt;▤ Rubros / categorías&lt;/button&gt;&lt;/div&gt;
					&lt;div class="spares-side-bottom"&gt;&lt;button class="switch-module" id="sparesSwitch"&gt;← Cambiar módulo&lt;/button&gt;&lt;button class="switch-module" id="sparesLogout"&gt;Cerrar sesión&lt;/button&gt;&lt;/div&gt;
				&lt;/aside&gt;
				&lt;main class="spares-main"&gt;
					&lt;div class="spares-toolbar"&gt;
						&lt;div&gt;
							&lt;h1 style="margin:0"&gt;Proveedores&lt;/h1&gt;
							&lt;div class="sub"&gt;Directorio de proveedores para repuestos e insumos&lt;/div&gt;
						&lt;/div&gt;
						&lt;div class="spares-toolbar-actions"&gt;
							&lt;input id="supplierSearch" type="text" placeholder="🔍 Buscar..." class="spares-input"&gt;
							&lt;button class="btn dark" id="manageCategories"&gt;Rubros&lt;/button&gt;
							&lt;button class="btn red" id="newSupplier"&gt;+ Nuevo proveedor&lt;/button&gt;
						&lt;/div&gt;
					&lt;/div&gt;
					&lt;div id="sparesList" class="spares-items-container"&gt;&lt;/div&gt;
					&lt;div id="supplierEditor" class="hidden spares-editor"&gt;&lt;/div&gt;
				&lt;/main&gt;
			&lt;/div&gt;
		&lt;/div&gt;
	`);
	$("goWorkshop").onclick=()=>{$("modulePicker").classList.add("hidden");$("sparesApp").classList.remove("hidden");};
	$("goSpares").onclick=()=>{$("modulePicker").classList.add("hidden");$("sparesApp").classList.remove("hidden");};
	$("sparesSwitch").onclick=()=>{$("sparesApp").classList.add("hidden");$("modulePicker").classList.remove("hidden");};
	$("sparesLogout").onclick=logout;
	$("sparesHomeBtn").onclick=showSuppliers;
	$("categoriesBtn").onclick=showCategories;
	$("newSupplier").onclick=showSupplierEditor;
	$("manageCategories").onclick=showCategories;
	$("supplierSearch").addEventListener("input",()=>buildSupplierList());
	buildSupplierList();
}

function getCategoryName(id){
	const c=categories.find(x=>x.id==id);
	return c?c.name:'';
}

async function fetchSuppliers(){
	const{data,error}=await sb.from('supplier').select('*').order('name');
	if(error)throw error;
	suppliers=data;
}

async function fetchCategories(){
	const{data,error}=await sb.from('category').select('*').order('name');
	if(error)throw error;
	categories=data;
}

function getFilteredSuppliers(){
	const search=($('supplierSearch').value||'').toLowerCase().trim();
	if(!search)return suppliers;
	return suppliers.filter(s=>{
		return s.name.toLowerCase().includes(search)
			||(s.category_name||'').toLowerCase().includes(search)
			||(s.city||'').toLowerCase().includes(search)
			||(s.email||'').toLowerCase().includes(search)
			||(s.tax_id||'').toLowerCase().includes(search)
			||(String(s.phone||'').replace(/\D/g,'').includes(search.replace(/\D/g,'')))
			||(String(s.whatsapp||'').replace(/\D/g,'').includes(search.replace(/\D/g,'')))
			||(s.bank_name||'').toLowerCase().includes(search)
			||(s.bank_alias||'').toLowerCase().includes(search)
			||(String(s.bank_cbu_cvu||'').replace(/\s/g,'').includes(search.replace(/\s/g,'')));
	});
}

function buildSupplierList(){
	const c=$('sparesList');
	c.innerHTML='';
	let filtered=getFilteredSuppliers();

	filtered.sort((a,b)=>{
		let va=supplierSort.key==='category_name'?(a.category_name||''):(a[supplierSort.key]??'');
		let vb=supplierSort.key==='category_name'?(b.category_name||''):(b[supplierSort.key]??'');
		va=String(va).toLowerCase();
		vb=String(vb).toLowerCase();
		if(va&lt;vb)return supplierSort.dir==='asc'?-1:1;
		if(va&gt;vb)return supplierSort.dir==='asc'?1:-1;
		return 0;
	});

	if(filtered.length===0){
		c.innerHTML=`&lt;div style="padding:40px;text-align:center;color:#999"&gt;No se encontraron proveedores.&lt;/div&gt;`;
		return;
	}

	filtered.forEach((sup)=>{
		const catName=sup.category_name||getCategoryName(sup.category_id)||'';
		const color=catName?rubroColor(catName):'#999';
		const waNum=(String(sup.whatsapp||sup.phone||'')).replace(/\D/g,'');
		const phoneNum=(String(sup.phone||'')).replace(/\D/g,'');
		const logoSrc=sup.logo||'/assets/default-logo.png';

		let actionBtns='';
		if(waNum.length&gt;3)actionBtns+=`&lt;button class="wa-btn mobile-btn" onclick="event.stopPropagation();window.open('https://wa.me/${waNum}','_blank','noreferrer')" title="WhatsApp" style="color:#25D366;border-color:#25D366;"&gt;💬 WA&lt;/button&gt;`;
		if(phoneNum.length&gt;3)actionBtns+=`&lt;button class="call-btn mobile-btn" onclick="event.stopPropagation();location.href='tel:${phoneNum}'" title="Llamar" style="color:#444;border-color:#444;"&gt;📞 LLAMAR&lt;/button&gt;`;

		const html=`
		&lt;div class="spares-item" id="sup_${sup.id}" onclick="showSupplierEditor(${sup.id})"&gt;
			&lt;img src="${logoSrc}" onerror="this.src='/assets/default-logo.png'"&gt;
			&lt;div&gt;
				&lt;b&gt;${esc(sup.name)}&lt;/b&gt;
				&lt;span class="rubro-pill" style="background:${color};color:#fff"&gt;${esc(catName)}&lt;/span&gt;
				${sup.tax_id?`&lt;br&gt;&lt;small style="color:#666"&gt;CUIT/CUIL: ${esc(sup.tax_id)}&lt;/small&gt;`:''}
				${actionBtns}
			&lt;/div&gt;
			&lt;div&gt;${esc(sup.city)}&lt;/div&gt;
			&lt;div&gt;${esc(sup.email)}&lt;/div&gt;
		&lt;/div&gt;`;
		c.insertAdjacentHTML('beforeend',html);
	});
}

async function showSupplierEditor(id){
	editingId=id;
	$("sparesList").classList.add("hidden");
	$("spares-toolbar-actions").classList.add("hidden");
	$("spares-toolbar").querySelector("h1").innerText=id?'Editar proveedor':'Nuevo proveedor';
	$("spares-toolbar").querySelector(".sub").innerText=id?'Modificá los datos del proveedor':'Completá los datos para registrar un nuevo proveedor.';
	$("spares-toolbar").querySelector("#manageCategories").classList.add("hidden");
	$("spares-toolbar").querySelector("#newSupplier").classList.add("hidden");
	const sup=id?suppliers.find(s=>s.id==id):{};
	const editor=$("supplierEditor");
	editor.classList.remove("hidden");
	editor.innerHTML=`
		&lt;form class="spares-editor-form" onsubmit="saveSupplier(event)"&gt;
			&lt;input type="hidden" name="id" value="${id||''}"&gt;
			&lt;div class="editor-section"&gt;
				&lt;h3 class="section-title"&gt;Datos generales&lt;/h3&gt;
				&lt;div class="form-row"&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;Nombre &lt;span style="color:red"&gt;*&lt;/span&gt;&lt;/label&gt;
						&lt;input name="name" type="text" value="${esc(sup.name||'')}" required&gt;
					&lt;/div&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;Rubro / Categoría &lt;span style="color:red"&gt;*&lt;/span&gt;&lt;/label&gt;
						&lt;select name="category_id" required&gt;${categories.map(c=>`&lt;option value="${c.id}" ${sup.category_id==c.id?'selected':''}&gt;${esc(c.name)}&lt;/option&gt;`).join('')}
						&lt;/select&gt;
					&lt;/div&gt;
				&lt;/div&gt;
				&lt;div class="form-row"&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;CUIT / CUIL&lt;/label&gt;
						&lt;input name="tax_id" type="text" value="${esc(sup.tax_id||'')}"&gt;
					&lt;/div&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;Logo URL&lt;/label&gt;
						&lt;input name="logo" type="url" value="${esc(sup.logo||'')}"&gt;
					&lt;/div&gt;
				&lt;/div&gt;
				&lt;div class="form-row"&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;Dirección&lt;/label&gt;
						&lt;input name="address" type="text" value="${esc(sup.address||'')}"&gt;
					&lt;/div&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;Ciudad&lt;/label&gt;
						&lt;input name="city" type="text" value="${esc(sup.city||'')}"&gt;
					&lt;/div&gt;
				&lt;/div&gt;
			&lt;/div&gt;
			&lt;div class="editor-section"&gt;
				&lt;h3 class="section-title"&gt;Contacto&lt;/h3&gt;
				&lt;div class="form-row"&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;Email&lt;/label&gt;
						&lt;input name="email" type="email" value="${esc(sup.email||'')}"&gt;
					&lt;/div&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;Teléfono&lt;/label&gt;
						&lt;input name="phone" type="tel" value="${esc(sup.phone||'')}"&gt;
					&lt;/div&gt;
				&lt;/div&gt;
				&lt;div class="form-row"&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;WhatsApp&lt;/label&gt;
						&lt;input name="whatsapp" type="tel" value="${esc(sup.whatsapp||'')}"&gt;
					&lt;/div&gt;
				&lt;/div&gt;
			&lt;/div&gt;
			&lt;div class="editor-section"&gt;
				&lt;h3 class="section-title"&gt;Datos bancarios&lt;/h3&gt;
				&lt;div class="form-row"&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;Banco&lt;/label&gt;
						&lt;input name="bank_name" type="text" value="${esc(sup.bank_name||'')}"&gt;
					&lt;/div&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;Titular de la cuenta&lt;/label&gt;
						&lt;input name="bank_holder" type="text" value="${esc(sup.bank_holder||'')}"&gt;
					&lt;/div&gt;
				&lt;/div&gt;
				&lt;div class="form-row"&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;CBU / CVU&lt;/label&gt;
						&lt;input name="bank_cbu_cvu" type="text" value="${esc(sup.bank_cbu_cvu||'')}"&gt;
					&lt;/div&gt;
					&lt;div class="form-field"&gt;
						&lt;label&gt;Alias&lt;/label&gt;
						&lt;input name="bank_alias" type="text" value="${esc(sup.bank_alias||'')}"&gt;
					&lt;/div&gt;
				&lt;/div&gt;
			&lt;/div&gt;
			&lt;div class="form-field"&gt;
				&lt;label&gt;Notas&lt;/label&gt;
				&lt;textarea name="notes"&gt;${esc(sup.notes||'')}&lt;/textarea&gt;
			&lt;/div&gt;
			&lt;div class="spares-editor-actions"&gt;
				&lt;button class="btn" type="button" onclick="cancelEdition()"&gt;Cancelar&lt;/button&gt;
				&lt;button class="btn dark" type="submit"&gt;Guardar&lt;/button&gt;
				${id?`&lt;button class="btn red" type="button" onclick="deleteSupplier(${sup.id})"&gt;Eliminar&lt;/button&gt;`:''}
			&lt;/div&gt;
		&lt;/form&gt;
	`;
}

function cancelEdition(){
	editingId=null;
	$("sparesList").classList.remove("hidden");
	$("spares-toolbar-actions").classList.remove("hidden");
	$("spares-toolbar").querySelector("h1").innerText='Proveedores';
	$("spares-toolbar").querySelector(".sub").innerText='Directorio de proveedores para repuestos e insumos';
	$("spares-toolbar").querySelector("#manageCategories").classList.remove("hidden");
	$("spares-toolbar").querySelector("#newSupplier").classList.remove("hidden");
	$("supplierEditor").classList.add("hidden");
}

async function saveSupplier(event){
	event.preventDefault();
	const data=Object.fromEntries(new FormData(event.target));
	const sup={...suppliers.find(s=>s.id==data.id),...data};
	if(data.id){
		const{error}=await sb.from('supplier').update(sup).eq('id',data.id);
		if(error)return alert(error.message);
	}
	else{
		const{error}=await sb.from('supplier').insert(sup);
		if(error)return alert(error.message);
	}
	await fetchSuppliers();
	buildSupplierList();
	cancelEdition();
}

async function deleteSupplier(id){
	if(!confirm('¿Estás seguro de eliminar este proveedor?'))return;
	const{error}=await sb.from('supplier').delete().eq('id',id);
	if(error)return alert(error.message);
	await fetchSuppliers();
	buildSupplierList();
}

function showCategories(){
	currentView='categories';
	$("sparesList").classList.add("hidden");
	$("spares-toolbar-actions").classList.add("hidden");
	$("spares-toolbar").querySelector("h1").innerText='Rubros';
	$("spares-toolbar").querySelector(".sub").innerText='Administrá los rubros/categorías de tus proveedores.';
	$("spares-toolbar").querySelector("#manageCategories").classList.add("hidden");
	$("spares-toolbar").querySelector("#newSupplier").classList.add("hidden");
	$("supplierSearch").classList.add("hidden");
	const container=$('sparesList');
	container.classList.remove("hidden");
	container.innerHTML=`
		&lt;div class="spares-toolbar"&gt;&lt;div&gt;&lt;h1&gt;Rubros&lt;/h1&gt;&lt;div class="sub"&gt;Administrá los rubros/categorías de tus proveedores.&lt;/div&gt;&lt;/div&gt;&lt;div class="spares-toolbar-actions"&gt;&lt;button class="btn red" id="newCategory"&gt;+ Nuevo rubro&lt;/button&gt;&lt;/div&gt;&lt;/div&gt;
		&lt;div class="spares-items-container"&gt;
			${categories.map(c=>{
				const color=rubroColor(c.name);
				return`&lt;div class="spares-item" id="cat_${c.id}" onclick="editCategory(${c.id})"&gt;
					&lt;span class="rubro-dot" style="background:${color}"&gt;&lt;/span&gt;
					&lt;div&gt;&lt;b&gt;${esc(c.name)}&lt;/b&gt;&lt;/div&gt;
				&lt;/div&gt;`;
			}).join('')}
		&lt;/div&gt;
		&lt;div id="categoryEditor" class="hidden spares-editor"&gt;
			&lt;form onsubmit="saveCategory(event)"&gt;
				&lt;input type="hidden" name="id"&gt;
				&lt;div class="form-field"&gt;
					&lt;label&gt;Nombre del rubro&lt;/label&gt;
					&lt;input name="name" type="text" required&gt;
				&lt;/div&gt;
				&lt;div class="spares-editor-actions"&gt;
					&lt;button class="btn" type="button" onclick="cancelEdition()"&gt;Cancelar&lt;/button&gt;
					&lt;button class="btn dark" type="submit"&gt;Guardar&lt;/button&gt;
				&lt;/div&gt;
			&lt;/form&gt;
		&lt;/div&gt;
	`;
	$("#newCategory").onclick=showCategoryEditor;
}

function showSuppliers(){
	currentView='suppliers';
	$("supplierSearch").classList.remove("hidden");
	$("sparesList").classList.remove("hidden");
	$("spares-toolbar-actions").classList.remove("hidden");
	$("spares-toolbar").querySelector("h1").innerText='Proveedores';
	$("spares-toolbar").querySelector(".sub").innerText='Directorio de proveedores para repuestos e insumos';
	$("spares-toolbar").querySelector("#manageCategories").classList.remove("hidden");
	$("spares-toolbar").querySelector("#newSupplier").classList.remove("hidden");
	$("supplierEditor").classList.add("hidden");
	buildSupplierList();
}

function showCategoryEditor(id){
	const el=$("sparesList");
	const editor=el.querySelector("#categoryEditor");
	editor.classList.remove("hidden");
	if(id){
		editor.querySelector("label").innerText='Editar rubro';
		editor.querySelector("input[name='id']").value=id;
		editor.querySelector("input[name='name']").value=esc(categories.find(c=>c.id==id)?.name);
	}
	else{
		editor.querySelector("label").innerText='Nuevo rubro';
		editor.querySelector("input[name='id']").value='';
		editor.querySelector("input[name='name']").value='';
	}
}

async function saveCategory(event){
	event.preventDefault();
	const data=Object.fromEntries(new FormData(event.target));
	if(data.id){
		const{error}=await sb.from('category').update(data).eq('id',data.id);
		if(error)return alert(error.message);
	}
	else{
		const{error}=await sb.from('category').insert(data);
		if(error)return alert(error.message);
	}
	await fetchCategories();
	showCategories();
}

async function editCategory(id){
	await fetchCategories();
	showCategoryEditor(id);
}

async function login(email,password){
	const{user,error}=await sb.auth.signInWithPassword({email,password});
	if(error)throw error;
	return user;
}

async function logout(){
	const{error}=await sb.auth.signOut();
	if(error)throw error;
	$("sparesApp").classList.add("hidden");
	$("modulePicker").classList.remove("hidden");
}

async function init(){
	buildUI();
	$("sparesApp").classList.add("hidden");
	$("modulePicker").classList.remove("hidden");
	const{data:{session}}=await sb.auth.getSession();
	if(session){
		$("sparesApp").classList.remove("hidden");
		$("modulePicker").classList.add("hidden");
		await fetchCategories();
		await fetchSuppliers();
		showSuppliers();
	}
}

init();
