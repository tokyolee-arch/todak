import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * 서버 측에서 사용하는 Supabase Admin 클라이언트
 * Service Role Key를 사용하여 RLS를 우회합니다.
 * API Routes에서만 사용하세요.
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 서버 측에서 사용하는 Supabase 클라이언트 (anon key 사용)
 * RLS가 적용됩니다.
 */
export function createAnonServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createSupabaseClient<Database>(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
