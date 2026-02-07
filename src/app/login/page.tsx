"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError("Supabase 클라이언트를 초기화할 수 없습니다.");
        return;
      }

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        // Google Provider가 활성화되지 않은 경우 안내 메시지
        if (authError.message.includes("provider")) {
          setError("Google 로그인이 아직 설정되지 않았습니다. 데모 모드를 이용해주세요.");
        } else {
          setError(authError.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 데모 모드 - Google 설정 없이 테스트용
  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);

    try {
      // 데모 사용자 생성
      const demoUser = {
        id: `demo-${Date.now()}`,
        email: "demo@todak.app",
        displayName: "데모 사용자",
        createdAt: new Date(),
      };

      // Zustand 스토어에 저장
      setUser(demoUser);
      
      // localStorage에도 저장 (새로고침 시 유지)
      localStorage.setItem("demoUser", JSON.stringify(demoUser));

      // 온보딩으로 이동
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "데모 로그인 실패");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-todak-cream to-white px-6 py-8">
      {/* 로고 영역 */}
      <div className="flex justify-center pt-8 pb-6">
        <Image
          src="/images/todak-logo.png"
          alt="TODAK 로고"
          width={160}
          height={50}
          priority
          className="object-contain"
        />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-todak-brown mb-2">
            TODAK
          </h1>
          <p className="text-sm text-gray-600">
            부모님과의 소통을 돕는 AI 비서
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">💬</span>
            <p className="text-sm text-gray-600">
              AI가 통화 내용을 기억하고
              <br />
              다음 대화를 준비해드려요
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">🔔</span>
            <p className="text-sm text-gray-600">
              적절한 타이밍에
              <br />
              연락을 도와드려요
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">❤️</span>
            <p className="text-sm text-gray-600">
              부모님과의 소중한 관계를
              <br />
              이어가세요
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 mb-4 px-1 text-center">{error}</p>
        )}
      </div>

      {/* 로그인 버튼 */}
      <div className="pb-4 space-y-3">
        <Button
          onClick={handleGoogleLogin}
          disabled={loading || demoLoading}
          className="h-12 w-full bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "로그인 중..." : "Google로 계속하기"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-500">또는</span>
          </div>
        </div>

        <Button
          onClick={handleDemoLogin}
          disabled={loading || demoLoading}
          variant="outline"
          className="h-12 w-full border-todak-orange text-todak-orange font-semibold hover:bg-todak-orange/10"
        >
          {demoLoading ? "시작 중..." : "🧪 데모 모드로 시작하기"}
        </Button>
        
        <p className="text-xs text-center text-gray-500">
          데모 모드는 로그인 없이 앱을 체험할 수 있습니다
        </p>
      </div>
    </div>
  );
}
