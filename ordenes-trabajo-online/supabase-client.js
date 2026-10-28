import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

export const SUPABASE_URL='https://dcmlbriqiybegmwanwlf.supabase.co';
export const SUPABASE_KEY='sb_publishable_a2lQbgcdZ8fa9ANiOT5dIA_qyH0b_B_';

const globalKey='__agrodiseno_supabase_client__';

export const supabase=globalThis[globalKey]||(globalThis[globalKey]=createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
));

export const sb=supabase;
export default supabase;
