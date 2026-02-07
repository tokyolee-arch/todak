"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/authStore";
import type { ExtractedSchedule } from "@/types";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";

// 로딩 컴포넌트
function LoadingState() {
  return (
    <div className="flex flex-col h-full bg-todak-cream items-center justify-center">
      <Card className="p-8 text-center mx-4">
        <div className="animate-spin w-16 h-16 border-4 border-todak-orange border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">
          AI가 일정을 추출하는 중입니다
        </p>
        <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요...</p>
      </Card>
    </div>
  );
}

// 메인 컨텐츠 컴포넌트
function AnalyzeContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const parentId = params.parentId as string;
  const conversationId = searchParams.get("conversationId");
  const mode = searchParams.get("mode"); // 'demo' 모드 체크

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [mood, setMood] = useState<"good" | "neutral" | "concerned">("neutral");
  const [schedules, setSchedules] = useState<ExtractedSchedule[]>([]);
  const [parentName, setParentName] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (mode === "demo") {
      // 데모 모드: sessionStorage에서 통화 내용 가져오기
      analyzeDemoConversation();
    } else if (conversationId) {
      // 정상 모드: API 호출
      analyzeConversation();
    }
  }, [conversationId, mode]);

  // 데모 모드 분석 (Supabase 없이 로컬에서 동작)
  const analyzeDemoConversation = async () => {
    try {
      const conversationText = sessionStorage.getItem("demoConversationText");
      
      if (!conversationText) {
        alert("통화 내용을 찾을 수 없습니다. 다시 시도해주세요.");
        router.back();
        return;
      }

      setIsDemoMode(true);

      // 데모 모드 API 호출 (conversationText 직접 전달)
      const response = await fetch("/api/extract-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          conversationText,
          parentName: "부모님",
          demoMode: true 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSummary(result.data.summary);
        setKeywords(result.data.keywords);
        setMood(result.data.mood);
        setSchedules(result.data.schedules);
        setParentName(result.data.parentName || "부모님");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error in demo analysis:", error);
      alert("분석 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeConversation = async () => {
    try {
      // AI 분석 API 호출
      const response = await fetch("/api/extract-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });

      const result = await response.json();

      if (result.success) {
        setSummary(result.data.summary);
        setKeywords(result.data.keywords);
        setMood(result.data.mood);
        setSchedules(result.data.schedules);
        setParentName(result.data.parentName || "부모님");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error analyzing conversation:", error);
      alert("분석 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSchedule = (scheduleId: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId ? { ...s, selected: !s.selected } : s
      )
    );
  };

  const selectAll = () => {
    const allSelected = schedules.every((s) => s.selected);
    setSchedules((prev) => prev.map((s) => ({ ...s, selected: !allSelected })));
  };

  // Google Calendar API로 일정 등록
  const addToGoogleCalendarAPI = async (
    token: string,
    schedule: ExtractedSchedule
  ): Promise<boolean> => {
    try {
      const startDate = new Date(schedule.dueDate);
      const endDate = addDays(startDate, 1);

      const event = {
        summary: `[토닥] ${schedule.topic}`,
        description: `${schedule.reason}\n\n유형: ${typeLabels[schedule.type] || schedule.type}\n부모님: ${parentName}`,
        start: {
          date: format(startDate, "yyyy-MM-dd"),
        },
        end: {
          date: format(endDate, "yyyy-MM-dd"),
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 60 },
          ],
        },
      };

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  };

  // ICS 파일 생성 및 다운로드 (게스트/fallback용)
  const downloadIcsFile = (selectedSchedules: ExtractedSchedule[]) => {
    const icsEvents = selectedSchedules.map((schedule) => {
      const startDate = new Date(schedule.dueDate);
      const endDate = addDays(startDate, 1);
      const dtStart = format(startDate, "yyyyMMdd");
      const dtEnd = format(endDate, "yyyyMMdd");
      const uid = `todak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@todak.app`;
      const desc = `${schedule.reason}\\n\\n유형: ${typeLabels[schedule.type] || schedule.type}\\n부모님: ${parentName}`;

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:[토닥] ${schedule.topic}`,
        `DESCRIPTION:${desc}`,
        "BEGIN:VALARM",
        "TRIGGER:-PT1H",
        "ACTION:DISPLAY",
        "DESCRIPTION:1시간 후 일정이 있습니다",
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n");
    });

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Todak//Events//KO",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:토닥 일정",
      ...icsEvents,
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "todak-schedules.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirm = async () => {
    const selectedSchedules = schedules.filter((s) => s.selected);

    if (selectedSchedules.length === 0) {
      if (!confirm("선택된 일정이 없습니다. 그대로 진행하시겠습니까?")) {
        return;
      }
      router.push("/");
      return;
    }

    setIsSaving(true);

    try {
      // 로컬 스토리지에 일정 저장 (앱 내부용)
      const existingActions = JSON.parse(localStorage.getItem("demoActions") || "[]");
      const newActions = selectedSchedules.map((schedule) => ({
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversation_id: conversationId,
        parent_id: parentId,
        type: schedule.type,
        topic: schedule.topic,
        reason: schedule.reason,
        due_date: schedule.dueDate,
        confidence: schedule.confidence,
        selected: true,
        completed: false,
        created_at: new Date().toISOString(),
      }));
      localStorage.setItem("demoActions", JSON.stringify([...existingActions, ...newActions]));

      // sessionStorage 정리
      sessionStorage.removeItem("demoConversationText");
      sessionStorage.removeItem("demoParentId");

      // Google Calendar 연동 시도
      const providerToken = useAuthStore.getState().providerToken;

      if (providerToken) {
        // Google 로그인 사용자: API로 자동 등록
        let successCount = 0;
        for (const schedule of selectedSchedules) {
          const ok = await addToGoogleCalendarAPI(providerToken, schedule);
          if (ok) successCount++;
        }

        if (successCount === selectedSchedules.length) {
          alert(`${successCount}개의 일정이 Google 캘린더에 등록되었습니다!`);
        } else if (successCount > 0) {
          alert(
            `${selectedSchedules.length}개 중 ${successCount}개가 Google 캘린더에 등록되었습니다.\n나머지는 수동으로 등록해주세요.`
          );
        } else {
          // API 실패 시 ICS 파일 다운로드로 fallback
          const proceed = confirm(
            "Google 캘린더 자동 등록에 실패했습니다.\n캘린더 파일(.ics)을 다운로드하시겠습니까?\n다운로드 후 파일을 열면 캘린더에 자동 등록됩니다."
          );
          if (proceed) {
            downloadIcsFile(selectedSchedules);
          }
        }
      } else {
        // 게스트 사용자: ICS 파일 다운로드
        const proceed = confirm(
          `${selectedSchedules.length}개의 일정을 캘린더 파일(.ics)로 다운로드하시겠습니까?\n다운로드 후 파일을 열면 캘린더에 자동 등록됩니다.`
        );
        if (proceed) {
          downloadIcsFile(selectedSchedules);
        }
      }

      // Supabase에도 저장 (정상 모드)
      if (!isDemoMode && conversationId) {
        try {
          const supabase = createClient();
          if (supabase) {
            for (const schedule of selectedSchedules) {
              await (
                supabase.from("actions") as unknown as {
                  insert: (data: {
                    conversation_id: string | null;
                    parent_id: string;
                    type: string;
                    topic: string;
                    reason: string;
                    due_date: string;
                    confidence: number;
                    selected: boolean;
                    completed: boolean;
                  }) => Promise<unknown>;
                }
              ).insert({
                conversation_id: conversationId,
                parent_id: parentId,
                type: schedule.type,
                topic: schedule.topic,
                reason: schedule.reason,
                due_date: schedule.dueDate,
                confidence: schedule.confidence,
                selected: true,
                completed: false,
              });
            }
          }
        } catch (dbError) {
          console.warn("Supabase 저장 실패 (무시):", dbError);
        }
      }

      router.push("/");
    } catch (error) {
      console.error("Error saving schedules:", error);
      alert("일정 저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const moodConfig = {
    good: { emoji: "😊", label: "좋음", color: "bg-todak-green" },
    neutral: { emoji: "😐", label: "보통", color: "bg-gray-400" },
    concerned: { emoji: "😔", label: "걱정됨", color: "bg-yellow-500" },
  };

  const typeLabels: Record<string, string> = {
    hospital: "🏥 병원",
    meeting: "👥 만남",
    follow_up: "📞 재연락",
    check_event: "✅ 확인",
    send_gift: "🎁 선물",
    confirm_delivery: "📦 배송",
  };

  const selectedCount = schedules.filter((s) => s.selected).length;

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <button onClick={() => router.back()} className="text-gray-600 mb-2">
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-todak-brown">일정 추출 완료</h1>
        <p className="text-sm text-gray-600 mt-1">
          {parentName}과(와)의 통화에서 추출된 일정입니다
        </p>
      </div>

      {/* 스크롤 가능한 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 요약 */}
        <Card className="p-4">
          <h2 className="text-base font-bold mb-3">📝 통화 요약</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <span className="text-xs text-gray-600">통화 분위기</span>
            <Badge className={`${moodConfig[mood].color} text-white text-xs`}>
              {moodConfig[mood].emoji} {moodConfig[mood].label}
            </Badge>
          </div>
        </Card>

        {/* 키워드 */}
        {keywords.length > 0 && (
          <Card className="p-4">
            <h2 className="text-base font-bold mb-3">🏷️ 주요 키워드</h2>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* 일정 선택 */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">
              📅 추출된 일정 ({schedules.length}개)
            </h2>
            {schedules.length > 0 && (
              <button
                onClick={selectAll}
                className="text-xs text-todak-orange font-medium"
              >
                {schedules.every((s) => s.selected) ? "전체 해제" : "전체 선택"}
              </button>
            )}
          </div>

          {schedules.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm">
              추출된 일정이 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    schedule.selected
                      ? "border-todak-orange bg-todak-orange/5"
                      : "border-gray-200 bg-white"
                  }`}
                  onClick={() => toggleSchedule(schedule.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={schedule.selected}
                      onCheckedChange={() => toggleSchedule(schedule.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="text-xs font-semibold">
                          {typeLabels[schedule.type] || schedule.type}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(schedule.dueDate), "M월 d일 (E)", {
                            locale: ko,
                          })}
                        </Badge>
                        {schedule.confidence < 0.7 && (
                          <Badge className="bg-yellow-500 text-white text-xs">
                            날짜 추정
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-sm text-gray-800 mb-0.5">
                        {schedule.topic}
                      </p>
                      <p className="text-xs text-gray-600">→ {schedule.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 하단 버튼 */}
      <div className="shrink-0 bg-white border-t p-4 space-y-2">
        <div className="text-center text-sm text-gray-600 mb-1">
          {selectedCount}개 선택됨
        </div>
        <Button
          onClick={handleConfirm}
          disabled={isSaving}
          className="w-full h-12 bg-todak-orange hover:bg-todak-orange/90 text-base font-semibold"
        >
          {isSaving ? "등록 중..." : "📅 캘린더에 등록하기"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="w-full h-10 text-gray-600"
        >
          나중에 하기
        </Button>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트 (Suspense 래핑)
export default function AnalyzeConversationPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AnalyzeContent />
    </Suspense>
  );
}
