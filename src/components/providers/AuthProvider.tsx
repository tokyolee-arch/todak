"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/authStore";

// 로그인 없이 접근 가능한 페이지
const PUBLIC_PATHS = ["/login", "/auth/callback"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, setProviderToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로그인 페이지는 Auth 체크 없이 바로 보여줌
    if (PUBLIC_PATHS.includes(pathname)) {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      // 1. 먼저 게스트 사용자 확인 (localStorage)
      try {
        const demoUserStr = localStorage.getItem("demoUser");
        if (demoUserStr) {
          const demoUser = JSON.parse(demoUserStr);
          setUser({
            id: demoUser.id,
            email: demoUser.email,
            displayName: demoUser.displayName,
            createdAt: new Date(demoUser.createdAt),
          });
          setIsLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem("demoUser");
      }

      // 2. Supabase Auth 확인
      const supabase = createClient();

      if (!supabase) {
        setIsLoading(false);
        router.push("/login");
        return;
      }

      try {
        // 타임아웃 적용 (5초)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 5000)
        );

        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise,
        ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (session?.user) {
          const authUser = session.user;

          // Google provider token 저장 (캘린더 연동용)
          if (session.provider_token) {
            setProviderToken(session.provider_token);
          }

          // users 테이블 저장 시도 (실패해도 로그인은 진행)
          try {
            const { data: existingUser } = await supabase
              .from("users")
              .select("id")
              .eq("id", authUser.id)
              .maybeSingle();

            if (!existingUser) {
              await supabase.from("users").insert({
                id: authUser.id,
                email: authUser.email,
                display_name:
                  authUser.user_metadata?.full_name ||
                  authUser.email?.split("@")[0],
              });
            }
          } catch (dbError) {
            console.warn("users 테이블 접근 실패 (무시):", dbError);
          }

          setUser({
            id: authUser.id,
            email: authUser.email || "",
            displayName:
              authUser.user_metadata?.full_name ||
              authUser.email?.split("@")[0],
            createdAt: new Date(authUser.created_at),
          });
        } else {
          setUser(null);
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, setUser, setProviderToken]);

  // Auth 상태 변화 구독 (별도 effect)
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const authUser = session.user;
        setUser({
          id: authUser.id,
          email: authUser.email || "",
          displayName:
            authUser.user_metadata?.full_name ||
            authUser.email?.split("@")[0],
          createdAt: new Date(authUser.created_at),
        });
        if (session.provider_token) {
          setProviderToken(session.provider_token);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProviderToken(null);
        localStorage.removeItem("demoUser");
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, setUser, setProviderToken]);

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-todak-cream">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-todak-orange border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
