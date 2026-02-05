"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/authStore";
import type { User } from "@/types";

const DEV_USER_EMAIL = "dev@todak.local";

/** Supabase에 사용자가 없으면 한 명 생성하고, 있으면 첫 사용자를 반환해 스토어에 세팅 */
async function getOrCreateDevUser(): Promise<{ user: User | null; error?: string }> {
  const supabase = createClient();
  if (!supabase) {
    return { user: null, error: "Supabase 클라이언트를 초기화할 수 없습니다. 환경변수를 확인해주세요." };
  }

  try {
    const { data: existing, error: selectError } = await supabase
      .from("users")
      .select("id, email, display_name, created_at")
      .limit(1)
      .maybeSingle();

    if (selectError) {
      // 테이블이 없거나 RLS 정책 문제
      console.error("Supabase select error:", selectError);
      return { 
        user: null, 
        error: `DB 조회 실패: ${selectError.message}. 마이그레이션과 RLS 정책이 적용되었는지 확인해주세요.` 
      };
    }

    if (existing) {
      return {
        user: {
          id: existing.id,
          email: existing.email,
          displayName: existing.display_name ?? undefined,
          createdAt: new Date(existing.created_at),
        }
      };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert({
        email: DEV_USER_EMAIL,
        display_name: "로컬 사용자",
      })
      .select("id, email, display_name, created_at")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return { 
        user: null, 
        error: `사용자 생성 실패: ${insertError.message}` 
      };
    }

    if (!inserted) {
      return { user: null, error: "사용자 생성에 실패했습니다." };
    }

    return {
      user: {
        id: inserted.id,
        email: inserted.email,
        displayName: inserted.display_name ?? undefined,
        createdAt: new Date(inserted.created_at),
      }
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { 
      user: null, 
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." 
    };
  }
}

export default function OnboardingWelcome() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrCreateDevUser();
      if (result.user) {
        setUser(result.user);
        router.push("/onboarding/parent-info");
      } else {
        setError(result.error ?? "Supabase 연결을 확인해 주세요.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "시작하기 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-todak-cream to-white px-6 py-8">
      {/* 로고 영역 */}
      <div className="flex justify-center pt-4 pb-6">
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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-todak-brown">
            TODAK에 오신 것을
            <br />
            환영합니다
          </h1>
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
          <p className="text-xs text-red-600 mb-4 px-1">{error}</p>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="pb-4">
        <Button
          onClick={handleStart}
          disabled={loading}
          className="h-12 w-full bg-todak-orange text-base font-semibold hover:bg-todak-orange/90"
        >
          {loading ? "연결 중…" : "시작하기"}
        </Button>
      </div>
    </div>
  );
}
