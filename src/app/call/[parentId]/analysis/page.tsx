"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Action } from "@/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ConversationRow {
  id: string;
  parent_id: string;
  summary: string | null;
  mood: string | null;
  parent_sentiment: string | null;
  keywords: string[] | null;
}

interface ActionRow {
  id: string;
  topic: string;
  reason: string | null;
  due_date: string;
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    parentId: row.parent_id,
    startedAt: new Date(),
    summary: row.summary ?? undefined,
    mood: (row.mood as Conversation["mood"]) ?? undefined,
    parentSentiment: row.parent_sentiment ?? undefined,
    keywords: row.keywords ?? undefined,
    interrupted: false,
  };
}

function toAction(row: ActionRow & { id: string; type?: string; parent_id?: string }): Action {
  return {
    id: row.id,
    parentId: row.parent_id ?? "",
    type: (row.type as Action["type"]) ?? "follow_up",
    topic: row.topic,
    reason: row.reason ?? undefined,
    dueDate: new Date(row.due_date),
    completed: false,
  };
}

export default function AnalysisResult() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const parentId = params.parentId as string;
  const conversationId = searchParams.get("conversationId");

  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!conversationId) return;

    const supabase = createClient();
    if (!supabase) return;

    const { data: convData } = await supabase
      .from("conversations")
      .select("id, parent_id, summary, mood, parent_sentiment, keywords")
      .eq("id", conversationId)
      .maybeSingle();

    if (convData) {
      setConversation(toConversation(convData as unknown as ConversationRow));
    }

    const { data: actionsData } = await supabase
      .from("actions")
      .select("id, topic, reason, due_date")
      .eq("conversation_id", conversationId)
      .order("due_date", { ascending: true });

    if (actionsData?.length) {
      setActions(
        actionsData.map((a: unknown) => toAction(a as ActionRow & { id: string }))
      );
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: existing } = await supabase
        .from("conversations")
        .select("summary")
        .eq("id", conversationId)
        .maybeSingle() as { data: { summary: string | null } | null };

      if (cancelled) return;

      if (existing?.summary) {
        await loadData();
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/analyze-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });

        if (cancelled) return;

        if (!response.ok) {
          const err = await response.json();
          setAnalysisError(err?.error ?? "분석 실패");
          setLoading(false);
          return;
        }

        await loadData();
      } catch (e) {
        if (!cancelled) {
          setAnalysisError(e instanceof Error ? e.message : "오류 발생");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, loadData]);

  const handleConfirm = () => {
    router.push("/");
  };

  const handleEdit = () => {
    router.push(
      `/call/${parentId}/edit-analysis?conversationId=${conversationId}`
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-todak-cream p-4">
        <Card className="p-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-todak-orange border-t-transparent" />
          <p className="text-sm font-semibold text-gray-700">
            AI가 통화 내용을 분석 중이에요
          </p>
          <p className="mt-1 text-xs text-gray-500">잠시만 기다려주세요...</p>
        </Card>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-todak-cream p-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-700">{analysisError}</p>
          <Button
            onClick={() => router.push("/")}
            className="mt-3 h-10 text-sm bg-todak-orange hover:bg-todak-orange/90"
          >
            홈으로
          </Button>
        </Card>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-todak-cream p-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-700">대화 정보를 불러올 수 없습니다.</p>
          <Button
            onClick={() => router.push("/")}
            className="mt-3 h-10 text-sm"
            variant="outline"
          >
            홈으로
          </Button>
        </Card>
      </div>
    );
  }

  const moodConfig = {
    good: { emoji: "😊", label: "밝고 건강해 보임", color: "bg-todak-green" },
    neutral: { emoji: "😐", label: "보통", color: "bg-gray-400" },
    concerned: { emoji: "😔", label: "걱정스러워 보임", color: "bg-yellow-500" },
  };

  const config = moodConfig[(conversation.mood as keyof typeof moodConfig) ?? "neutral"] ?? moodConfig.neutral;

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <h1 className="text-lg font-bold">통화 분석 완료</h1>
        </div>
      </div>

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <Card className="p-4">
          <h2 className="text-sm font-bold mb-3">📝 통화 요약</h2>
          <p className="leading-relaxed text-xs text-gray-700">
            {conversation.summary || "요약이 없습니다."}
          </p>

          <div className="mt-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">부모님 컨디션</span>
              <Badge className={`${config.color} text-white text-xs`}>
                {config.emoji} {config.label}
              </Badge>
            </div>
            {conversation.parentSentiment && (
              <p className="mt-1.5 text-xs text-gray-600">
                {conversation.parentSentiment}
              </p>
            )}
          </div>
        </Card>

        {actions.length > 0 && (
          <Card className="p-4">
            <h2 className="text-sm font-bold mb-3">📌 AI가 제안하는 다음 할 일</h2>
            <div className="space-y-3">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="border-l-4 border-todak-orange pl-3"
                >
                  <div className="mb-1 flex items-start justify-between">
                    <p className="font-semibold text-xs text-gray-800">{action.topic}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {format(action.dueDate, "M/d", { locale: ko })}
                    </Badge>
                  </div>
                  {action.reason && (
                    <p className="text-xs text-gray-600">→ {action.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {conversation.keywords && conversation.keywords.length > 0 && (
          <Card className="p-4">
            <h2 className="text-sm font-bold mb-3">🏷️ 주요 키워드</h2>
            <div className="flex flex-wrap gap-1.5">
              {conversation.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="space-y-2 border-t border-gray-200 bg-white p-4 shrink-0">
        <Button
          onClick={handleConfirm}
          className="h-11 w-full bg-todak-orange text-sm font-semibold hover:bg-todak-orange/90"
        >
          맞아요
        </Button>
        <Button
          variant="outline"
          onClick={handleEdit}
          className="h-10 w-full text-gray-600 text-sm"
        >
          수정하기
        </Button>
      </div>
    </div>
  );
}
