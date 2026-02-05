"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/authStore";
import type { Parent, Conversation, Action } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { BottomNav } from "@/components/layout/BottomNav";

interface ParentRow {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  min_contact_interval_days: number;
}

interface ConversationRow {
  id: string;
  parent_id: string;
  ended_at: string | null;
  duration_minutes: number | null;
  mood: string | null;
  summary: string | null;
}

interface ActionRow {
  id: string;
  conversation_id: string | null;
  parent_id: string;
  type: string;
  topic: string;
  due_date: string;
  completed: boolean;
}

function toParent(row: ParentRow): Parent {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    relationship: row.relationship as Parent["relationship"],
    minContactIntervalDays: row.min_contact_interval_days,
  };
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    parentId: row.parent_id,
    startedAt: new Date(),
    endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    mood: (row.mood as Conversation["mood"]) ?? undefined,
    summary: row.summary ?? undefined,
    interrupted: false,
  };
}

function toAction(row: ActionRow): Action {
  return {
    id: row.id,
    conversationId: row.conversation_id ?? undefined,
    parentId: row.parent_id,
    type: row.type as Action["type"],
    topic: row.topic,
    dueDate: new Date(row.due_date),
    completed: row.completed,
  };
}

export default function History() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [parents, setParents] = useState<Parent[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [conversations, setConversations] = useState<
    Record<string, Conversation[]>
  >({});
  const [actions, setActions] = useState<Record<string, Action[]>>({});

  useEffect(() => {
    if (!user) {
      router.push("/onboarding");
      return;
    }
    loadData();
  }, [user, router]);

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

  const loadData = async () => {
    if (!user) return;

    const supabase = createClient();
    if (!supabase) return;

    const { data: parentsData } = await supabase
      .from("parents")
      .select("id, user_id, name, relationship, min_contact_interval_days")
      .eq("user_id", user.id);

    if (parentsData?.length) {
      const mapped = (parentsData as unknown as ParentRow[]).map(toParent);
      setParents(mapped);
      if (!activeTab) setActiveTab(mapped[0].id);

      for (const parent of mapped) {
        const { data: convData } = await supabase
          .from("conversations")
          .select("id, parent_id, ended_at, duration_minutes, mood, summary")
          .eq("parent_id", parent.id)
          .not("ended_at", "is", null)
          .order("ended_at", { ascending: false });

        if (convData?.length) {
          setConversations((prev) => ({
            ...prev,
            [parent.id]: (convData as unknown as ConversationRow[]).map(
              toConversation
            ),
          }));
        }

        const { data: actionsData } = await supabase
          .from("actions")
          .select("id, conversation_id, parent_id, type, topic, due_date, completed")
          .eq("parent_id", parent.id)
          .order("due_date", { ascending: true });

        if (actionsData?.length) {
          setActions((prev) => ({
            ...prev,
            [parent.id]: (actionsData as unknown as ActionRow[]).map(toAction),
          }));
        }
      }
    }
  };

  const moodConfig = {
    good: { emoji: "😊", label: "좋았어요" },
    neutral: { emoji: "😐", label: "그냥 그래요" },
    concerned: { emoji: "😔", label: "걱정됨" },
  };

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <h1 className="text-xl font-bold text-todak-brown">대화</h1>
        <p className="mt-1 text-xs text-gray-600">부모님과의 대화 기록</p>
      </div>

      {parents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 text-center">
            부모님을 등록하면 대화 기록이 여기에 표시돼요.
          </p>
        </div>
      ) : (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-gray-200/90 bg-white shrink-0">
          <TabsList className="w-full justify-start gap-0 rounded-none border-0 bg-transparent px-2">
            {parents.map((parent) => (
              <TabsTrigger
                key={parent.id}
                value={parent.id}
                className="flex-1 py-2 text-sm"
              >
                {parent.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {parents.map((parent) => (
          <TabsContent
            key={parent.id}
            value={parent.id}
            className="flex-1 overflow-y-auto p-4 space-y-4 m-0"
          >
            <div className="space-y-4">
              {!conversations[parent.id]?.length && (
                <p className="py-6 text-center text-xs text-gray-500">
                  아직 대화 기록이 없어요
                </p>
              )}
              {conversations[parent.id]?.map((conv, index) => {
                const convActions = actions[parent.id]?.filter(
                  (a) => a.conversationId === conv.id
                );
                const mood =
                  conv.mood && moodConfig[conv.mood as keyof typeof moodConfig]
                    ? moodConfig[conv.mood as keyof typeof moodConfig]
                    : null;
                return (
                  <div key={conv.id} className="relative pl-1">
                    {index < conversations[parent.id].length - 1 && (
                      <div className="absolute left-[18px] top-12 bottom-0 w-px bg-gray-200/80" aria-hidden />
                    )}
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-todak-brown/90 text-xs font-semibold text-white shadow-sm">
                        {conv.endedAt
                          ? format(conv.endedAt, "d", { locale: ko })
                          : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800">
                          {conv.endedAt
                            ? format(conv.endedAt, "M월 d일", { locale: ko })
                            : "-"}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {conv.endedAt
                            ? formatDistanceToNow(conv.endedAt, {
                                addSuffix: true,
                                locale: ko,
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                    <Card className="ml-11 border-gray-200/80 bg-white shadow-sm space-y-2 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">📞</span>
                          <span className="text-xs font-semibold">
                            통화 {conv.durationMinutes ?? 0}분
                          </span>
                        </div>
                        {mood && (
                          <Badge variant="outline" className="text-[10px]">
                            {mood.emoji} {mood.label}
                          </Badge>
                        )}
                      </div>
                      {conv.summary && (
                        <p className="text-xs text-gray-700">{conv.summary}</p>
                      )}
                      {convActions && convActions.length > 0 && (
                        <div className="space-y-1.5 border-t border-gray-100 pt-2">
                          <p className="text-[10px] font-semibold text-gray-600">
                            다음 액션
                          </p>
                          {convActions.map((action) => (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() =>
                                toggleActionComplete(action.id, action.completed)
                              }
                              className="flex w-full items-center justify-between rounded-lg py-1 pr-1 text-left text-[10px] transition-colors hover:bg-gray-50 active:bg-gray-100"
                            >
                              <span
                                className={
                                  action.completed
                                    ? "text-gray-400 line-through"
                                    : "text-gray-700"
                                }
                              >
                                • {action.topic}
                              </span>
                              {action.completed ? (
                                <Badge className="shrink-0 bg-todak-green/90 text-[10px] text-white">
                                  완료
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 text-[10px] text-gray-500"
                                >
                                  {format(action.dueDate, "M/d")}
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/history/detail?conversationId=${conv.id}`
                          )
                        }
                        className="mt-1 text-[10px] font-semibold text-todak-orange"
                      >
                        자세히 보기 →
                      </button>
                    </Card>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      )}

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}
