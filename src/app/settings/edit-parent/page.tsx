"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function EditParentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const relationship = searchParams.get("relationship");

  const label =
    relationship === "mother" ? "어머니" : relationship === "father" ? "아버지" : "부모님";

  return (
    <div className="min-h-screen bg-todak-cream p-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="min-h-touch mb-4 text-gray-600"
      >
        ← 뒤로
      </button>
      <Card className="p-6">
        <h2 className="text-heading font-bold text-todak-brown mb-4">
          {label} 정보 수정
        </h2>
        <p className="text-body text-gray-600 mb-6">
          이름, 생년월일, 연락처, 연락 주기 등을 수정할 수 있습니다. (준비 중)
        </p>
        <Button
          variant="outline"
          className="min-h-touch w-full"
          onClick={() => router.back()}
        >
          설정으로 돌아가기
        </Button>
      </Card>
    </div>
  );
}
