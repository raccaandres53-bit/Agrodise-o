import * as real from 'https://esm.sh/@supabase/supabase-js@2.117.3?bundle';

export * from 'https://esm.sh/@supabase/supabase-js@2.117.3?bundle';

const clients=new Map();

export function createClient(url,key,options={}){
  const cacheKey=String(url||'');
  if(clients.has(cacheKey)) return clients.get(cacheKey);
  const client=real.createClient(url,key,options);
  clients.set(cacheKey,client);
  globalThis.__agrodiseno_supabase_client__=client;
  return client;
}
