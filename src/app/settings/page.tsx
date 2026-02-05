"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/authStore";
import { BottomNav } from "@/components/layout/BottomNav";

export default function Settings() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [settings, setSettings] = useState({
    recordingEnabled: true,
    aiAnalysisEnabled: true,
    notificationActionDue: true,
    notificationCallIncomplete: true,
    notificationPeriodic: true,
    notificationEventTrigger: true,
  });

  useEffect(() => {
    if (!user) {
      router.push("/onboarding");
      return;
    }
    loadSettings();
  }, [user, router]);

  const loadSettings = async () => {
    if (!user) return;

    const supabase = createClient();
    if (!supabase) return;

    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setSettings({
        recordingEnabled: data.recording_enabled ?? true,
        aiAnalysisEnabled: data.ai_analysis_enabled ?? true,
        notificationActionDue: data.notification_action_due ?? true,
        notificationCallIncomplete: data.notification_call_incomplete ?? true,
        notificationPeriodic: data.notification_periodic ?? true,
        notificationEventTrigger: data.notification_event_trigger ?? true,
      });
    }
  };

  const updateSetting = async (
    key: keyof typeof settings,
    value: boolean
  ) => {
    if (!user) return;

    const supabase = createClient();
    if (!supabase) return;

    const next = { ...settings, [key]: value };
    setSettings(next);

    await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        recording_enabled: next.recordingEnabled,
        ai_analysis_enabled: next.aiAnalysisEnabled,
        notification_action_due: next.notificationActionDue,
        notification_call_incomplete: next.notificationCallIncomplete,
        notification_periodic: next.notificationPeriodic,
        notification_event_trigger: next.notificationEventTrigger,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <h1 className="text-xl font-bold text-todak-brown">설정</h1>
      </div>

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <Card className="p-4">
          <h2 className="text-sm font-bold mb-2">내 정보</h2>
          <div className="space-y-1">
            <p className="font-semibold text-sm">
              {user?.displayName ?? user?.email ?? "회원"}님
            </p>
            <p className="text-xs text-gray-600">{user?.email}</p>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-bold mb-3">통화 설정</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="recording" className="text-xs">통화 녹음</Label>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  AI 분석을 위해 통화를 녹음합니다
                </p>
              </div>
              <Switch
                id="recording"
                checked={settings.recordingEnabled}
                onCheckedChange={(checked) =>
                  updateSetting("recordingEnabled", checked === true)
                }
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="analysis" className="text-xs">AI 자동 분석</Label>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  통화 후 AI가 자동으로 분석합니다
                </p>
              </div>
              <Switch
                id="analysis"
                checked={settings.aiAnalysisEnabled}
                onCheckedChange={(checked) =>
                  updateSetting("aiAnalysisEnabled", checked === true)
                }
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-bold mb-3">알림 설정</h2>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">예정된 액션 알림</Label>
              <Switch
                checked={settings.notificationActionDue}
                onCheckedChange={(checked) =>
                  updateSetting("notificationActionDue", checked === true)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">미완료 통화 알림</Label>
              <Switch
                checked={settings.notificationCallIncomplete}
                onCheckedChange={(checked) =>
                  updateSetting("notificationCallIncomplete", checked === true)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">주기적 연락 알림</Label>
              <Switch
                checked={settings.notificationPeriodic}
                onCheckedChange={(checked) =>
                  updateSetting("notificationPeriodic", checked === true)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">이벤트 트리거 알림</Label>
              <Switch
                checked={settings.notificationEventTrigger}
                onCheckedChange={(checked) =>
                  updateSetting("notificationEventTrigger", checked === true)
                }
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-bold mb-3">부모님 정보 관리</h2>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="h-9 w-full justify-start text-xs"
              onClick={() =>
                router.push("/settings/edit-parent?relationship=mother")
              }
            >
              어머니 정보 수정 →
            </Button>
            <Button
              variant="outline"
              className="h-9 w-full justify-start text-xs"
              onClick={() =>
                router.push("/settings/edit-parent?relationship=father")
              }
            >
              아버지 정보 수정 →
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-bold mb-3">개인정보</h2>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="h-9 w-full justify-start text-xs"
            >
              데이터 다운로드 →
            </Button>
            <Button
              variant="outline"
              className="h-9 w-full justify-start text-xs text-red-500"
              onClick={() => {
                if (confirm("정말 모든 데이터를 삭제하시겠습니까?")) {
                  // TODO: 데이터 삭제 처리
                }
              }}
            >
              모든 데이터 삭제 →
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-bold mb-2">서비스 정보</h2>
          <div className="space-y-1 text-xs text-gray-600">
            <p>버전: v0.1.0 Beta</p>
            <p>개인정보 처리방침</p>
            <p>서비스 이용약관</p>
          </div>
        </Card>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}
