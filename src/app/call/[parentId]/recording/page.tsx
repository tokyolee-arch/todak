"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function CallRecording() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const parentId = params.parentId as string;
  const conversationId = searchParams.get("conversationId");

  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEndCall = async () => {
    if (!conversationId) {
      router.push("/");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      router.push(`/call/${parentId}/analysis?conversationId=${conversationId}`);
      return;
    }

    await (supabase as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } } })
      .from("conversations")
      .update({
        ended_at: new Date().toISOString(),
        duration_minutes: Math.floor(duration / 60),
      })
      .eq("id", conversationId);

    setIsRecording(false);
    router.push(
      `/call/${parentId}/analysis?conversationId=${conversationId}`
    );
  };

  return (
    <div className="flex h-full items-center justify-center bg-todak-cream p-4">
      <Card className="w-full p-6 text-center">
        <div className="space-y-5">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-todak-orange/20">
            <span className="text-3xl">📞</span>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-1">통화 중</h2>
            <p className="text-xs text-gray-600">AI가 대화를 기록하고 있어요</p>
          </div>

          {isRecording && (
            <div className="flex items-center justify-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-gray-600">녹음 중</span>
            </div>
          )}

          <div className="text-2xl font-bold text-todak-brown">
            {formatTime(duration)}
          </div>

          <Button
            onClick={handleEndCall}
            className="h-11 w-full bg-red-500 text-sm font-semibold text-white hover:bg-red-600"
          >
            통화 종료
          </Button>
        </div>
      </Card>
    </div>
  );
}
