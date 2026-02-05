"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function EditAnalysisPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const parentId = params.parentId as string;
  const conversationId = searchParams.get("conversationId");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-todak-cream p-6">
      <Card className="w-full max-w-md space-y-6 p-8 text-center">
        <h2 className="text-heading font-bold text-todak-brown">분석 수정</h2>
        <p className="text-body text-gray-600">
          분석 결과 수정 기능은 준비 중입니다.
        </p>
        <Button
          onClick={() =>
            router.push(
              `/call/${parentId}/analysis?conversationId=${conversationId}`
            )
          }
          variant="outline"
          className="min-h-touch w-full"
        >
          분석 결과로 돌아가기
        </Button>
        <Button
          onClick={() => router.push("/")}
          className="min-h-touch w-full bg-todak-brown hover:bg-todak-brown/90"
        >
          홈으로
        </Button>
      </Card>
    </div>
  );
}
