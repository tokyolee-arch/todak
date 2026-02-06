"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Parent } from "@/types";

interface ParentRow {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  min_contact_interval_days: number;
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

export default function CallPreparation() {
  const params = useParams();
  const router = useRouter();
  const parentId = params.parentId as string;

  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParent();
  }, [parentId]);

  const loadParent = async () => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: parentData } = await supabase
      .from("parents")
      .select("id, user_id, name, relationship, min_contact_interval_days")
      .eq("id", parentId)
      .maybeSingle();

    if (parentData) {
      setParent(toParent(parentData as unknown as ParentRow));
    }
    setLoading(false);
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
        <p className="text-sm text-todak-brown/80">
          부모님 정보를 찾을 수 없습니다.
        </p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="h-10 text-sm"
        >
          뒤로
        </Button>
      </div>
    );
  }

  const relationshipLabel =
    parent.relationship === "mother" ? "어머니" : "아버지";

  return (
    <div className="flex h-full flex-col items-center justify-center bg-todak-cream p-4">
      <Card className="w-full max-w-sm p-6 text-center space-y-5">
        {/* 아이콘 */}
        <div className="w-20 h-20 mx-auto bg-todak-orange/20 rounded-full flex items-center justify-center">
          <span className="text-4xl">💬</span>
        </div>

        {/* 제목 */}
        <div>
          <h2 className="text-lg font-bold text-todak-brown mb-1">
            {parent.name} {relationshipLabel}와 통화
          </h2>
          <p className="text-sm text-gray-600">
            통화한 내용을 입력하시면
            <br />
            AI가 자동으로 일정을 추출해드립니다
          </p>
        </div>

        {/* 버튼 */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={() => router.push(`/call/${parentId}/input`)}
            className="w-full h-12 bg-todak-orange hover:bg-todak-orange/90 text-base font-semibold"
          >
            📝 통화 내용 입력하기
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="w-full h-10 text-gray-600 text-sm"
          >
            나중에 하기
          </Button>
        </div>
      </Card>
    </div>
  );
}
