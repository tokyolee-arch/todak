"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/authStore";

export default function RecordingConsent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async () => {
    const supabase = createClient();
    if (!user || !supabase) return;

    const typedSupabase = supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => Promise<unknown> } };

    try {
      await typedSupabase.from("user_settings").insert({
        user_id: user.id,
        recording_enabled: agreed,
        ai_analysis_enabled: agreed,
      });

      router.push("/");
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="p-4 shrink-0">
        <h1 className="text-lg font-bold text-todak-brown">
          통화 녹음 및 AI 분석
        </h1>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        <Card className="space-y-3 p-4">
          <p className="text-sm">
            TODAK은 부모님과의 통화를 녹음하여 AI가 분석합니다.
          </p>

          <div className="space-y-2 text-xs text-gray-600">
            <p>
              📌 <strong>녹음 목적:</strong> 대화 내용 분석 및 다음 연락 준비
            </p>
            <p>
              📌 <strong>보관 기간:</strong> 분석 완료 후 24시간 내 자동 삭제
            </p>
            <p>
              📌 <strong>데이터 보호:</strong> 암호화 저장, 외부 공유 절대 금지
            </p>
            <p>
              📌 <strong>언제든 변경 가능:</strong> 설정에서 비활성화할 수 있습니다
            </p>
          </div>

          <div className="flex items-start gap-3 border-t pt-3">
            <Checkbox
              id="consent"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label
              htmlFor="consent"
              className="cursor-pointer text-xs leading-relaxed"
            >
              통화 녹음 및 AI 분석에 동의합니다. (필수)
            </label>
          </div>
        </Card>
      </div>

      {/* 하단 버튼 */}
      <div className="p-4 shrink-0 bg-white border-t">
        <Button
          onClick={handleSubmit}
          disabled={!agreed}
          className="h-11 w-full bg-todak-orange text-sm font-semibold hover:bg-todak-orange/90"
        >
          시작하기
        </Button>
      </div>
    </div>
  );
}
