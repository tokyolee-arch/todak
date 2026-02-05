"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Parent, Action, Conversation } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface ParentRow {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  birthday: string | null;
  phone: string | null;
  profile_image_url: string | null;
  min_contact_interval_days: number;
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
}

interface ConversationRow {
  id: string;
  parent_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  summary: string | null;
  keywords: string[] | null;
}

function toParent(row: ParentRow): Parent {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    relationship: row.relationship as Parent["relationship"],
    birthday: row.birthday ? new Date(row.birthday) : undefined,
    phone: row.phone ?? undefined,
    profileImageUrl: row.profile_image_url ?? undefined,
    minContactIntervalDays: row.min_contact_interval_days,
  };
}

function toAction(row: ActionRow): Action {
  return {
    id: row.id,
    conversationId: row.conversation_id ?? undefined,
    parentId: row.parent_id,
    type: row.type as Action["type"],
    topic: row.topic,
    reason: row.reason ?? undefined,
    dueDate: new Date(row.due_date),
    completed: row.completed,
  };
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    parentId: row.parent_id,
    startedAt: new Date(row.started_at),
    endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    summary: row.summary ?? undefined,
    keywords: row.keywords ?? undefined,
    interrupted: false,
  };
}

function generateTopics(
  actions: Action[],
  lastConv: Conversation | null,
  setSuggestedTopics: (topics: string[]) => void
) {
  const topics: string[] = [];

  actions?.forEach((action) => {
    if (action.type === "follow_up") {
      topics.push(`${action.topic}은 어떻게 되셨어요?`);
    } else if (action.type === "confirm_delivery") {
      topics.push(`${action.topic} 잘 받으셨어요?`);
    }
  });

  if (lastConv?.keywords?.length) {
    lastConv.keywords.slice(0, 2).forEach((keyword) => {
      topics.push(`지난번 말씀하신 ${keyword}은 어떠세요?`);
    });
  }

  topics.push("요즘 건강은 어떠세요?");
  topics.push("날씨가 많이 추운데 괜찮으세요?");

  setSuggestedTopics(topics.slice(0, 5));
}

export default function CallPreparation() {
  const params = useParams();
  const router = useRouter();
  const parentId = params.parentId as string;

  const [parent, setParent] = useState<Parent | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [lastConversation, setLastConversation] =
    useState<Conversation | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [parentId]);

  const loadData = async () => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: parentData } = await supabase
      .from("parents")
      .select("*")
      .eq("id", parentId)
      .maybeSingle();

    if (parentData) {
      setParent(toParent(parentData as unknown as ParentRow));
    }

    const { data: actionsData } = await supabase
      .from("actions")
      .select("*")
      .eq("parent_id", parentId)
      .eq("completed", false)
      .order("due_date", { ascending: true });

    const mappedActions =
      actionsData?.map((a) => toAction(a as unknown as ActionRow)) ?? [];
    setActions(mappedActions);

    const { data: lastConv } = await supabase
      .from("conversations")
      .select("*")
      .eq("parent_id", parentId)
      .not("ended_at", "is", null)
      .order("ended_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastConv) {
      setLastConversation(toConversation(lastConv as unknown as ConversationRow));
    }

    generateTopics(
      mappedActions,
      lastConv ? toConversation(lastConv as unknown as ConversationRow) : null,
      setSuggestedTopics
    );
    setLoading(false);
  };

  const handleCall = async () => {
    if (!parent) return;

    const supabase = createClient();
    if (!supabase) return;

    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        parent_id: parentId,
        started_at: new Date().toISOString(),
        interrupted: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error starting conversation:", error);
      return;
    }

    if (conversation) {
      if (parent.phone) {
        window.location.href = `tel:${parent.phone}`;
      }
      router.push(
        `/call/${parentId}/recording?conversationId=${conversation.id}`
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-todak-cream">
        <p className="text-sm text-todak-brown/80">로딩 중...</p>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-todak-cream p-4">
        <p className="text-sm text-todak-brown/80">부모님 정보를 찾을 수 없습니다.</p>
        <Button onClick={() => router.back()} variant="outline" className="h-10 text-sm">
          뒤로
        </Button>
      </div>
    );
  }

  const relationshipLabel =
    parent.relationship === "mother" ? "어머니" : "아버지";

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-2 text-gray-600 text-sm"
        >
          ← 뒤로
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {parent.relationship === "mother" ? "👩" : "👨"}
          </span>
          <div>
            <h1 className="text-lg font-bold">
              {parent.name}께 전화하기
            </h1>
            <p className="text-xs text-gray-600">{relationshipLabel}</p>
          </div>
        </div>
      </div>

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {actions.length > 0 && (
          <Card className="p-4">
            <h2 className="text-sm font-bold mb-3">📋 오늘 확인할 내용</h2>
            <div className="space-y-2">
              {actions.map((action) => (
                <div key={action.id} className="flex items-start gap-2">
                  <span className="text-base text-todak-green">✓</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{action.topic}</p>
                    {action.reason && (
                      <p className="mt-0.5 text-xs text-gray-600">
                        ({action.reason})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h2 className="text-sm font-bold mb-3">💡 대화 주제 제안</h2>
          <div className="space-y-1.5">
            {suggestedTopics.map((topic, index) => (
              <div key={index} className="pl-3 text-xs text-gray-700">• {topic}</div>
            ))}
          </div>
        </Card>

        {lastConversation && lastConversation.endedAt && (
          <Card className="p-4">
            <h2 className="text-sm font-bold mb-3">🕐 마지막 통화</h2>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                {formatDistanceToNow(lastConversation.endedAt, {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
              {lastConversation.summary && (
                <p className="mt-1">{lastConversation.summary}</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="border-t border-gray-200 bg-white p-4 shrink-0 space-y-2">
        <Button
          onClick={handleCall}
          className="h-11 w-full bg-todak-orange text-sm font-semibold hover:bg-todak-orange/90"
        >
          📞 전화 걸기
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="h-10 w-full text-gray-600 text-sm"
        >
          나중에 하기
        </Button>
      </div>
    </div>
  );
}
