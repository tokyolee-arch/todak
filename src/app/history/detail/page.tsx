"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  mood: string | null;
  parent_sentiment: string | null;
  summary: string | null;
  keywords: string[] | null;
  transcript: string | null;
}

interface ActionRow {
  id: string;
  conversation_id: string | null;
  parent_id: string;
  type: string;
  topic: string;
  reason: string | null;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
}

function HistoryDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [conversationId]);

  const loadData = async () => {
    if (!conversationId) return;

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();

    if (convData) {
      const row = convData as unknown as ConversationRow;
      setConversation({
        id: row.id,
        parentId: row.parent_id,
        startedAt: new Date(row.started_at),
        endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
        durationMinutes: row.duration_minutes ?? undefined,
        mood: (row.mood as Conversation["mood"]) ?? undefined,
        parentSentiment: row.parent_sentiment ?? undefined,
        summary: row.summary ?? undefined,
        keywords: row.keywords ?? undefined,
        transcript: row.transcript ?? undefined,
        interrupted: false,
      });
    }

    const { data: actionsData } = await supabase
      .from("actions")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("due_date", { ascending: true });

    if (actionsData?.length) {
      setActions(
        (actionsData as unknown as ActionRow[]).map((a) => ({
          id: a.id,
          conversationId: a.conversation_id ?? undefined,
          parentId: a.parent_id,
          type: a.type as Action["type"],
          topic: a.topic,
          reason: a.reason ?? undefined,
          dueDate: new Date(a.due_date),
          completed: a.completed,
          completedAt: a.completed_at
            ? new Date(a.completed_at)
            : undefined,
        }))
      );
    }
    setLoading(false);
  };

  const toggleActionComplete = async (actionId: string, completed: boolean) => {
    const supabase = createClient();
    if (!supabase) return;
    await (supabase as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } } })
      .from("actions")
      .update({
        completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null,
      })
      .eq("id", actionId);
    await loadData();
  };

  const moodConfig = {
    good: { emoji: "😊", label: "좋았어요", color: "bg-todak-green" },
    neutral: { emoji: "😐", label: "그냥 그래요", color: "bg-gray-400" },
    concerned: { emoji: "😔", label: "걱정됨", color: "bg-yellow-500" },
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-todak-cream">
        <p className="text-body text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-todak-cream p-6">
        <p className="text-body text-gray-600">대화를 찾을 수 없습니다.</p>
        <Button onClick={() => router.back()} variant="outline">
          뒤로
        </Button>
      </div>
    );
  }

  const mood =
    conversation.mood && moodConfig[conversation.mood as keyof typeof moodConfig]
      ? moodConfig[conversation.mood as keyof typeof moodConfig]
      : null;

  return (
    <div className="min-h-screen bg-todak-cream pb-24">
      <div className="bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-touch mb-4 text-gray-600"
        >
          ← 뒤로
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading font-bold text-todak-brown">
              통화 상세
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {conversation.endedAt
                ? format(conversation.endedAt, "yyyy년 M월 d일 HH:mm", {
                    locale: ko,
                  })
                : "날짜 없음"}
            </p>
          </div>
          {mood && (
            <Badge className={`${mood.color} text-white`}>
              {mood.emoji} {mood.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-3">📞 통화 정보</h2>
          <p className="text-sm text-gray-600">
            통화 시간: {conversation.durationMinutes ?? 0}분
          </p>
        </Card>

        {conversation.summary && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-3">📝 요약</h2>
            <p className="text-body leading-relaxed text-gray-700">
              {conversation.summary}
            </p>
          </Card>
        )}

        {conversation.parentSentiment && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-3">💬 부모님 컨디션</h2>
            <p className="text-body text-gray-700">
              {conversation.parentSentiment}
            </p>
          </Card>
        )}

        {conversation.keywords && conversation.keywords.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-3">🏷️ 키워드</h2>
            <div className="flex flex-wrap gap-2">
              {conversation.keywords.map((kw, i) => (
                <Badge key={i} variant="secondary">
                  {kw}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {actions.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">다음 할 일</h2>
            <div className="space-y-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() =>
                    toggleActionComplete(action.id, action.completed)
                  }
                  className="flex w-full min-h-touch items-start justify-between rounded-lg border-l-4 border-todak-brown/30 bg-gray-50/50 pl-4 pr-3 py-3 text-left transition-colors hover:bg-gray-100/80 active:bg-gray-100"
                >
                  <div className="min-w-0">
                    <p
                      className={
                        action.completed
                          ? "font-medium text-gray-400 line-through"
                          : "font-semibold text-gray-800"
                      }
                    >
                      {action.topic}
                    </p>
                    {action.reason && (
                      <p className="mt-1 text-sm text-gray-600">
                        → {action.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {format(action.dueDate, "M/d", { locale: ko })}
                    </span>
                    {action.completed ? (
                      <Badge className="bg-todak-green/90 text-white">완료</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">탭하여 완료</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {conversation.transcript && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-3">📄 대화 내용</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {conversation.transcript}
            </p>
          </Card>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-gray-200 bg-white p-4">
        <Button
          onClick={() => router.push("/history")}
          className="min-h-touch w-full bg-todak-orange hover:bg-todak-orange/90"
        >
          대화 목록으로
        </Button>
      </div>
    </div>
  );
}

export default function HistoryDetail() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-todak-cream"><p className="text-body text-gray-600">로딩 중...</p></div>}>
      <HistoryDetailContent />
    </Suspense>
  );
}
