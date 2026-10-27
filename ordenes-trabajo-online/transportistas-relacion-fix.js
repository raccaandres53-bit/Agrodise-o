const originalFetch = window.fetch.bind(window);

window.fetch = async function(input, init){
  try{
    const originalUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    if(originalUrl.includes('/rest/v1/carriers?')){
      const url = new URL(originalUrl);
      const select = url.searchParams.get('select');
      if(select && select.includes('carrier_routes(') && !select.includes('carrier_routes!carriers_route_id_fkey(')){
        url.searchParams.set('select', select.replace('carrier_routes(', 'carrier_routes!carriers_route_id_fkey('));
        if(input instanceof Request){
          input = new Request(url.toString(), input);
        }else{
          input = url.toString();
        }
      }
    }
  }catch(e){
    console.warn('No se pudo ajustar la relación principal de recorridos', e);
  }
  return originalFetch(input, init);
};
