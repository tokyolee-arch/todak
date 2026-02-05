"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/authStore";
import type { Parent, Action } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { BottomNav } from "@/components/layout/BottomNav";

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
  completed_at: string | null;
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
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [parents, setParents] = useState<Parent[]>([]);
  const [actions, setActions] = useState<Record<string, Action[]>>({});
  const [lastContacts, setLastContacts] = useState<Record<string, Date>>({});

  useEffect(() => {
    if (!user) {
      router.push("/onboarding");
      return;
    }

    loadData();
  }, [user, router]);

  const loadData = async () => {
    if (!user) return;

    const supabase = createClient();
    if (!supabase) return;

    const { data: parentsData } = await supabase
      .from("parents")
      .select("*")
      .eq("user_id", user.id);

    if (parentsData && parentsData.length > 0) {
      const rows = parentsData as unknown as ParentRow[];
      setParents(rows.map(toParent));

      for (const parent of rows) {
        const { data: lastConv } = await supabase
          .from("conversations")
          .select("ended_at")
          .eq("parent_id", parent.id)
          .order("ended_at", { ascending: false })
          .limit(1)
          .maybeSingle() as { data: { ended_at: string | null } | null };

        if (lastConv?.ended_at) {
          setLastContacts((prev) => ({
            ...prev,
            [parent.id]: new Date(lastConv.ended_at as string),
          }));
        }

        const { data: actionsData } = await supabase
          .from("actions")
          .select("*")
          .eq("parent_id", parent.id)
          .eq("completed", false)
          .order("due_date", { ascending: true })
          .limit(2);

        if (actionsData && actionsData.length > 0) {
          const actionRows = actionsData as unknown as ActionRow[];
          setActions((prev) => ({
            ...prev,
            [parent.id]: actionRows.map(toAction),
          }));
        }
      }
    }
  };

  const getRelationshipStatus = (
    parentId: string,
    minInterval: number
  ): "good" | "attention" | "urgent" => {
    const lastContact = lastContacts[parentId];
    if (!lastContact) return "urgent";

    const daysSince = Math.floor(
      (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince < minInterval) return "good";
    if (daysSince < minInterval * 1.5) return "attention";
    return "urgent";
  };

  const statusConfig = {
    good: { color: "bg-todak-green", label: "좋음", emoji: "🟢" },
    attention: { color: "bg-yellow-500", label: "연락 필요", emoji: "🟡" },
    urgent: { color: "bg-todak-orange", label: "긴급", emoji: "🔴" },
  };

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <h1 className="text-xl font-bold text-todak-brown">TODAK</h1>
        <p className="mt-1 text-sm text-gray-600">
          {user?.displayName ?? user?.email ?? "회원"}님의 부모님 관계 현황
        </p>
      </div>

      {/* 스크롤 가능한 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {parents.length === 0 && (
          <Card className="p-4 text-center text-sm text-gray-600">
            등록된 부모님이 없습니다. 설정에서 부모님 정보를 추가해 주세요.
          </Card>
        )}

        {parents.map((parent) => {
          const status = getRelationshipStatus(
            parent.id,
            parent.minContactIntervalDays
          );
          const config = statusConfig[status];
          const parentActions = actions[parent.id] ?? [];
          const lastContact = lastContacts[parent.id];

          return (
            <Card key={parent.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {parent.relationship === "mother" ? "👩" : "👨"}
                  </span>
                  <div>
                    <h2 className="text-base font-bold">{parent.name}</h2>
                    <p className="text-xs text-gray-600">
                      {parent.relationship === "mother" ? "어머니" : "아버지"}
                    </p>
                  </div>
                </div>
                <Badge className={`${config.color} text-white text-xs`}>
                  {config.emoji} {config.label}
                </Badge>
              </div>

              <div className="text-xs text-gray-600">
                마지막 연락:{" "}
                {lastContact
                  ? formatDistanceToNow(lastContact, {
                      addSuffix: true,
                      locale: ko,
                    })
                  : "기록 없음"}
              </div>

              {parentActions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700">
                    📌 다음 할 일:
                  </p>
                  {parentActions.map((action) => (
                    <div
                      key={action.id}
                      className="pl-3 text-xs text-gray-600"
                    >
                      • {action.topic}
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => router.push(`/call/${parent.id}`)}
                className="h-10 w-full bg-todak-orange hover:bg-todak-orange/90 text-sm"
              >
                📞 전화하기
              </Button>
            </Card>
          );
        })}
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}
