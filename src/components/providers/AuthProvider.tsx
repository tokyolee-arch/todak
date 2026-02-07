"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/authStore";

// 로그인 없이 접근 가능한 페이지
const PUBLIC_PATHS = ["/login"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. 먼저 데모 사용자 확인 (localStorage)
      const demoUserStr = localStorage.getItem("demoUser");
      if (demoUserStr) {
        try {
          const demoUser = JSON.parse(demoUserStr);
          setUser({
            id: demoUser.id,
            email: demoUser.email,
            displayName: demoUser.displayName,
            createdAt: new Date(demoUser.createdAt),
          });
          setIsLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem("demoUser");
        }
      }

      // 2. Supabase Auth 확인
      const supabase = createClient();
      
      if (!supabase) {
        // Supabase가 설정되지 않은 경우
        setIsLoading(false);
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push("/login");
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Supabase Auth 사용자 정보를 우리 User 타입으로 변환
          const authUser = session.user;
          
          // users 테이블에 사용자 정보 저장/업데이트
          const { data: existingUser } = await supabase
            .from("users")
            .select("id, email, display_name, created_at")
            .eq("id", authUser.id)
            .maybeSingle();

          if (!existingUser) {
            // 새 사용자 - users 테이블에 추가
            await supabase.from("users").insert({
              id: authUser.id,
              email: authUser.email,
              display_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
            });
          }

          setUser({
            id: authUser.id,
            email: authUser.email || "",
            displayName: authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
            createdAt: new Date(authUser.created_at),
          });
        } else {
          setUser(null);
          
          // 로그인 페이지가 아니면 로그인 페이지로 리다이렉트
          if (!PUBLIC_PATHS.includes(pathname)) {
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Auth 상태 변화 구독
    const supabase = createClient();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            const authUser = session.user;
            setUser({
              id: authUser.id,
              email: authUser.email || "",
              displayName: authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
              createdAt: new Date(authUser.created_at),
            });
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            localStorage.removeItem("demoUser"); // 데모 사용자도 로그아웃
            router.push("/login");
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [pathname, router, setUser]);

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
