"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/authStore";

export default function OnboardingWelcome() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // 로그인하지 않은 경우 로그인 페이지로
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleStart = () => {
    router.push("/onboarding/parent-info");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-todak-cream to-white px-6 py-8">
      {/* 뒤로가기 */}
      <button
        onClick={() => router.push("/login")}
        className="text-gray-600 text-sm mb-2 flex items-center gap-1"
      >
        ← 뒤로
      </button>

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
            {user.displayName || user.email?.split("@")[0]}님,
            <br />
            환영합니다!
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
      </div>

      {/* 하단 버튼 */}
      <div className="pb-4">
        <Button
          onClick={handleStart}
          className="h-12 w-full bg-todak-orange text-base font-semibold hover:bg-todak-orange/90"
        >
          부모님 정보 입력하기
        </Button>
      </div>
    </div>
  );
}
