"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Next.js 14 App Router용 Supabase 클라이언트.
 * (createClientComponentClient from @supabase/auth-helpers-nextjs 사용 시
 *  해당 패키지 설치 후 createClientComponentClient<Database>() 로 교체 가능)
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
    return null;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getClient() {
  if (typeof window === "undefined") return null;
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}

// 하위 호환성을 위해 유지
export const supabase = typeof window !== "undefined" ? createClient() : null;
