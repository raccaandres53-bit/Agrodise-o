// Mejora accesibilidad: asocia automáticamente <label> con input/select/textarea.
// Funciona tanto para HTML inicial como para formularios creados dinámicamente por los módulos.
(function(){
  let seq=0;

  function safeId(prefix='field'){
    let id;
    do { id=`agro-${prefix}-${++seq}`; } while(document.getElementById(id));
    return id;
  }

  function associateLabel(label){
    if(!(label instanceof HTMLLabelElement)) return;
    if(label.htmlFor && document.getElementById(label.htmlFor)) return;

    // Si el control ya está dentro del label, la asociación HTML ya es válida.
    const nested=label.querySelector('input,select,textarea');
    if(nested){
      if(!nested.id) nested.id=safeId('field');
      label.htmlFor=nested.id;
      return;
    }

    // En la app la mayoría de los labels están dentro de un contenedor de campo.
    const scope=label.closest('.field,.spares-field,.knowledge-form label,.knowledge-dialog,.spares-dialog,.dialog') || label.parentElement;
    if(!scope) return;

    let control=null;
    // Prioridad: control hermano / del mismo bloque de campo.
    if(label.nextElementSibling?.matches?.('input,select,textarea')) control=label.nextElementSibling;
    if(!control) control=scope.querySelector('input:not([type="hidden"]),select,textarea');
    if(!control) return;

    if(!control.id) control.id=safeId('field');
    label.htmlFor=control.id;
  }

  function fix(root=document){
    if(root instanceof HTMLLabelElement) associateLabel(root);
    root.querySelectorAll?.('label').forEach(associateLabel);
  }

  fix();

  const observer=new MutationObserver(mutations=>{
    for(const m of mutations){
      for(const node of m.addedNodes){
        if(node.nodeType===1) fix(node);
      }
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
