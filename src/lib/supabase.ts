import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ppxfltszjrwxlchgcpoq.supabase.co";
const supabaseAnonKey =
  "sb_publishable_WeecR17M18bgkHpJ402faA_W6scK_jL";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "implicit",
  },
});
