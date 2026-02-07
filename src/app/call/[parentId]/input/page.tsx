"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sampleConversations } from "@/data/sampleConversations";

export default function ConversationInput() {
  const params = useParams();
  const router = useRouter();
  const parentId = params.parentId as string;

  const [conversationText, setConversationText] = useState("");
  const [selectedSample, setSelectedSample] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSampleSelect = (sampleId: string) => {
    const sample = sampleConversations.find((s) => s.id === sampleId);
    if (sample) {
      setConversationText(sample.conversationText);
      setSelectedSample(sampleId);
    }
  };

  const handleSubmit = async () => {
    if (!conversationText.trim()) {
      alert("통화 내용을 입력해주세요");
      return;
    }

    setIsLoading(true);

    try {
      // 항상 데모 모드 사용 (프로토타입 단계에서 가장 안정적)
      // Supabase 연결 없이도 동작하도록 함
      
      // sessionStorage에 통화 내용 저장
      sessionStorage.setItem("demoConversationText", conversationText);
      sessionStorage.setItem("demoParentId", parentId);
      
      // 데모 모드로 분석 화면 이동
      router.push(`/call/${parentId}/analyze?mode=demo`);
    } catch (error) {
      console.error("Error:", error);
      alert("오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <button onClick={() => router.back()} className="text-gray-600 mb-2">
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-todak-brown">통화 내용 입력</h1>
        <p className="text-sm text-gray-600 mt-1">
          통화 내용을 입력하거나 샘플을 선택하세요
        </p>
      </div>

      {/* 스크롤 가능한 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 샘플 선택 */}
        <Card className="p-4">
          <h2 className="text-base font-bold mb-3">💡 샘플 통화 선택</h2>
          <Select value={selectedSample} onValueChange={handleSampleSelect}>
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="샘플을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {sampleConversations.map((sample) => (
                <SelectItem key={sample.id} value={sample.id}>
                  {sample.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* 텍스트 입력 */}
        <Card className="p-4">
          <h2 className="text-base font-bold mb-3">📝 통화 내용</h2>
          <Textarea
            value={conversationText}
            onChange={(e) => setConversationText(e.target.value)}
            placeholder={`통화 내용을 입력하세요...\n\n예:\n아들: 엄마, 요즘 어떻게 지내세요?\n어머니: 잘 지내고 있어...`}
            className="min-h-[200px] text-base leading-relaxed resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            {conversationText.length} 글자
          </p>
        </Card>
      </div>

      {/* 하단 버튼 */}
      <div className="shrink-0 bg-white border-t p-4 space-y-2">
        <Button
          onClick={handleSubmit}
          disabled={!conversationText.trim() || isLoading}
          className="w-full h-12 bg-todak-orange hover:bg-todak-orange/90 text-base font-semibold"
        >
          {isLoading ? "분석 중..." : "🤖 AI 분석 시작"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-full h-10 text-gray-600"
        >
          취소
        </Button>
      </div>
    </div>
  );
}
