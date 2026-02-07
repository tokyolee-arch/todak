"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/authStore";
import { format, addDays } from "date-fns";

interface ParentData {
  name: string;
  phone: string;
  minContactInterval: number;
  passedAway: boolean;
  events: {
    birthdayEnabled: boolean;
    birthdayCalendar: "solar" | "lunar";
    birthdayMonth: string;
    birthdayDay: string;
    anniversaryEnabled: boolean;
    anniversaryMonth: string;
    anniversaryDay: string;
    otherEnabled: boolean;
    otherDate: string;
    otherName: string;
  };
}

const initialParentData: ParentData = {
  name: "",
  phone: "",
  minContactInterval: 14,
  passedAway: false,
  events: {
    birthdayEnabled: false,
    birthdayCalendar: "solar",
    birthdayMonth: "",
    birthdayDay: "",
    anniversaryEnabled: false,
    anniversaryMonth: "",
    anniversaryDay: "",
    otherEnabled: false,
    otherDate: "",
    otherName: "",
  },
};

// 월 옵션 생성
const months = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}월`,
}));

// 일 옵션 생성
const days = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}일`,
}));

// localStorage 키
const PARENT_DATA_KEY = "todak_parent_data";

// 저장 데이터 구조
interface SavedParentData {
  mother: ParentData;
  father: ParentData;
  savedAt: string;
}

// ICS 파일 생성 (캘린더 표준 포맷 - 모든 캘린더 앱에서 사용 가능)
function generateIcsFile(
  events: Array<{ title: string; month: number; day: number; description: string }>
): string {
  const now = new Date();

  const icsEvents = events.map((event) => {
    let year = now.getFullYear();
    const eventDate = new Date(year, event.month - 1, event.day);
    if (eventDate < now) {
      year += 1;
    }
    const startDate = new Date(year, event.month - 1, event.day);
    const endDate = addDays(startDate, 1);

    const dtStart = format(startDate, "yyyyMMdd");
    const dtEnd = format(endDate, "yyyyMMdd");
    const uid = `todak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@todak.app`;
    const desc = event.description.replace(/\n/g, "\\n");

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${desc}`,
      "RRULE:FREQ=YEARLY",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:내일 이벤트가 있습니다",
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      "DESCRIPTION:1시간 후 이벤트가 있습니다",
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Todak//Events//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:토닥 이벤트",
    ...icsEvents,
    "END:VCALENDAR",
  ].join("\r\n");
}

// ICS 파일 다운로드
function downloadIcsFile(
  events: Array<{ title: string; month: number; day: number; description: string }>
) {
  const icsContent = generateIcsFile(events);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "todak-events.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Google Calendar API로 연간 반복 이벤트 등록
async function addRecurringEventToCalendar(
  token: string,
  title: string,
  month: number,
  day: number,
  description: string
): Promise<boolean> {
  try {
    const now = new Date();
    let year = now.getFullYear();
    const eventDate = new Date(year, month - 1, day);
    if (eventDate < now) {
      year += 1;
    }
    const startDate = new Date(year, month - 1, day);
    const endDate = addDays(startDate, 1);

    const event = {
      summary: title,
      description,
      start: { date: format(startDate, "yyyy-MM-dd") },
      end: { date: format(endDate, "yyyy-MM-dd") },
      recurrence: ["RRULE:FREQ=YEARLY"],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 1440 }, // 1일 전
          { method: "popup", minutes: 60 },    // 1시간 전
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
}

export default function ParentInfo() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const providerToken = useAuthStore((state) => state.providerToken);

  const [activeTab, setActiveTab] = useState<"mother" | "father">("mother");
  const [motherData, setMotherData] = useState<ParentData>({ ...initialParentData });
  const [fatherData, setFatherData] = useState<ParentData>({ ...initialParentData });
  const [isSaving, setIsSaving] = useState(false);

  const isPassedAway = activeTab === "mother" ? motherData.passedAway : fatherData.passedAway;

  // 페이지 로드 시 저장된 데이터 불러오기
  useEffect(() => {
    try {
      const savedStr = localStorage.getItem(PARENT_DATA_KEY);
      if (savedStr) {
        const saved: SavedParentData = JSON.parse(savedStr);
        if (saved.mother) setMotherData(saved.mother);
        if (saved.father) setFatherData(saved.father);
      }
    } catch (e) {
      console.warn("부모님 정보 로드 실패:", e);
    }
  }, []);

  // 이벤트 목록 수집 (캘린더 등록용)
  const collectEvents = (
    parentData: ParentData,
    relationship: string
  ): Array<{ title: string; month: number; day: number; description: string }> => {
    const events: Array<{ title: string; month: number; day: number; description: string }> = [];
    const label = relationship === "mother" ? "어머니" : "아버지";

    if (
      parentData.events.birthdayEnabled &&
      parentData.events.birthdayMonth &&
      parentData.events.birthdayDay
    ) {
      const calType = parentData.events.birthdayCalendar === "lunar" ? "(음력)" : "";
      events.push({
        title: `[토닥] ${parentData.name || label} 생일 ${calType}`,
        month: parseInt(parentData.events.birthdayMonth),
        day: parseInt(parentData.events.birthdayDay),
        description: `${parentData.name || label}의 생일입니다.\n토닥에서 자동 등록됨`,
      });
    }

    if (
      parentData.events.anniversaryEnabled &&
      parentData.events.anniversaryMonth &&
      parentData.events.anniversaryDay
    ) {
      events.push({
        title: `[토닥] 부모님 결혼기념일`,
        month: parseInt(parentData.events.anniversaryMonth),
        day: parseInt(parentData.events.anniversaryDay),
        description: `부모님 결혼기념일입니다.\n토닥에서 자동 등록됨`,
      });
    }

    if (
      parentData.events.otherEnabled &&
      parentData.events.otherDate &&
      parentData.events.otherName
    ) {
      const otherDate = new Date(parentData.events.otherDate);
      events.push({
        title: `[토닥] ${parentData.events.otherName}`,
        month: otherDate.getMonth() + 1,
        day: otherDate.getDate(),
        description: `${parentData.events.otherName} (${parentData.name || label})\n토닥에서 자동 등록됨`,
      });
    }

    return events;
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      // 1. localStorage에 저장 (데이터 유지)
      const saveData: SavedParentData = {
        mother: motherData,
        father: fatherData,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(PARENT_DATA_KEY, JSON.stringify(saveData));

      // 2. Supabase에도 저장 시도
      const supabase = createClient();
      if (user && supabase) {
        const typedSupabase = supabase as unknown as {
          from: (table: string) => {
            insert: (data: Record<string, unknown>) => Promise<unknown>;
            upsert: (data: Record<string, unknown>) => Promise<unknown>;
          };
        };

        try {
          if (motherData.name && !motherData.passedAway) {
            await typedSupabase.from("parents").insert({
              user_id: user.id,
              name: motherData.name,
              relationship: "mother",
              phone: motherData.phone || null,
              min_contact_interval_days: motherData.minContactInterval,
            });
          }
          if (fatherData.name && !fatherData.passedAway) {
            await typedSupabase.from("parents").insert({
              user_id: user.id,
              name: fatherData.name,
              relationship: "father",
              phone: fatherData.phone || null,
              min_contact_interval_days: fatherData.minContactInterval,
            });
          }
        } catch (dbError) {
          console.warn("Supabase 저장 실패 (무시):", dbError);
        }
      }

      // 3. Google Calendar에 이벤트 등록
      const allEvents = [
        ...collectEvents(motherData, "mother"),
        ...collectEvents(fatherData, "father"),
      ];

      // 결혼기념일 중복 제거 (어머니/아버지 탭에서 같은 기념일이 입력될 수 있음)
      const uniqueEvents = allEvents.filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.title === event.title && e.month === event.month && e.day === event.day)
      );

      if (uniqueEvents.length > 0) {
        if (providerToken) {
          // Google 로그인 사용자: API로 자동 등록
          let successCount = 0;
          for (const event of uniqueEvents) {
            const ok = await addRecurringEventToCalendar(
              providerToken,
              event.title,
              event.month,
              event.day,
              event.description
            );
            if (ok) successCount++;
          }

          if (successCount === uniqueEvents.length) {
            alert(
              `부모님 정보가 저장되었습니다!\n${successCount}개의 이벤트가 Google 캘린더에 등록되었습니다.`
            );
          } else if (successCount > 0) {
            alert(
              `부모님 정보가 저장되었습니다!\n${uniqueEvents.length}개 중 ${successCount}개가 Google 캘린더에 등록되었습니다.`
            );
          } else {
            // API 실패 시 ICS 파일 다운로드로 fallback
            const proceed = confirm(
              "부모님 정보가 저장되었습니다!\nGoogle 캘린더 자동 등록에 실패했습니다.\n캘린더 파일(.ics)을 다운로드하시겠습니까?"
            );
            if (proceed) {
              downloadIcsFile(uniqueEvents);
            }
          }
        } else {
          // 게스트 사용자: ICS 파일 다운로드
          const proceed = confirm(
            `부모님 정보가 저장되었습니다!\n${uniqueEvents.length}개의 이벤트를 캘린더 파일(.ics)로 다운로드하시겠습니까?\n다운로드 후 파일을 열면 캘린더에 자동 등록됩니다.`
          );
          if (proceed) {
            downloadIcsFile(uniqueEvents);
          }
        }
      } else {
        alert("부모님 정보가 저장되었습니다!");
      }

      router.push("/");
    } catch (error) {
      console.error("Error saving parent info:", error);
      alert("저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const currentData = activeTab === "mother" ? motherData : fatherData;
  const setCurrentData = activeTab === "mother" ? setMotherData : setFatherData;

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <button
          onClick={() => router.back()}
          className="text-gray-600 text-sm mb-2 flex items-center gap-1"
        >
          ← 뒤로
        </button>
        <h1 className="text-lg font-bold text-todak-brown">
          부모님 정보를 알려주세요
        </h1>
      </div>

      {/* 탭 */}
      <div className="px-4 shrink-0">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("mother")}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm ${
              activeTab === "mother"
                ? "bg-todak-brown text-white"
                : "bg-white text-gray-600"
            }`}
          >
            어머니
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("father")}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm ${
              activeTab === "father"
                ? "bg-todak-brown text-white"
                : "bg-white text-gray-600"
            }`}
          >
            아버지
          </button>
        </div>
      </div>

      {/* 폼 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 기본 정보 카드 */}
        <Card className={`space-y-3 p-4 transition-all ${isPassedAway ? "opacity-40 pointer-events-none" : ""}`}>
          <div>
            <Label htmlFor="name" className="text-sm">이름 *</Label>
            <Input
              id="name"
              value={currentData.name}
              onChange={(e) =>
                setCurrentData({ ...currentData, name: e.target.value })
              }
              placeholder="예: 홍길순"
              className="h-10 text-sm"
              disabled={isPassedAway}
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm">연락처 (선택)</Label>
            <Input
              id="phone"
              type="tel"
              value={currentData.phone}
              onChange={(e) =>
                setCurrentData({ ...currentData, phone: e.target.value })
              }
              placeholder="010-1234-5678"
              className="h-10 text-sm"
              disabled={isPassedAway}
            />
          </div>

          <div>
            <Label htmlFor="interval" className="text-sm">최소 연락 주기</Label>
            <Select
              value={currentData.minContactInterval.toString()}
              onValueChange={(value) =>
                setCurrentData({
                  ...currentData,
                  minContactInterval: parseInt(value, 10),
                })
              }
              disabled={isPassedAway}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">선택안함</SelectItem>
                <SelectItem value="1">매일</SelectItem>
                <SelectItem value="2">이틀에 한 번</SelectItem>
                <SelectItem value="4">일주일에 2번</SelectItem>
                <SelectItem value="7">1주일에 한 번</SelectItem>
                <SelectItem value="14">2주일에 한 번</SelectItem>
                <SelectItem value="30">한 달에 한 번</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* 이벤트 챙기기 */}
        <Card className={`space-y-3 p-4 transition-all ${isPassedAway ? "opacity-40 pointer-events-none" : ""}`}>
          <Label className="text-sm font-semibold">이벤트 챙기기</Label>
          
          {/* 생일 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`birthday-event-${activeTab}`}
                checked={currentData.events.birthdayEnabled}
                onCheckedChange={(checked) =>
                  setCurrentData({
                    ...currentData,
                    events: {
                      ...currentData.events,
                      birthdayEnabled: checked === true,
                    },
                  })
                }
                disabled={isPassedAway}
              />
              <label htmlFor={`birthday-event-${activeTab}`} className="text-sm cursor-pointer">
                생일
              </label>
            </div>
            {currentData.events.birthdayEnabled && (
              <div className="ml-6 space-y-2">
                {/* 음력/양력 선택 */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={`calendar-${activeTab}`}
                      checked={currentData.events.birthdayCalendar === "solar"}
                      onChange={() =>
                        setCurrentData({
                          ...currentData,
                          events: {
                            ...currentData.events,
                            birthdayCalendar: "solar",
                          },
                        })
                      }
                      disabled={isPassedAway}
                      className="w-4 h-4"
                    />
                    양력
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={`calendar-${activeTab}`}
                      checked={currentData.events.birthdayCalendar === "lunar"}
                      onChange={() =>
                        setCurrentData({
                          ...currentData,
                          events: {
                            ...currentData.events,
                            birthdayCalendar: "lunar",
                          },
                        })
                      }
                      disabled={isPassedAway}
                      className="w-4 h-4"
                    />
                    음력
                  </label>
                </div>
                {/* 월/일 선택 */}
                <div className="flex gap-2">
                  <Select
                    value={currentData.events.birthdayMonth}
                    onValueChange={(value) =>
                      setCurrentData({
                        ...currentData,
                        events: {
                          ...currentData.events,
                          birthdayMonth: value,
                        },
                      })
                    }
                    disabled={isPassedAway}
                  >
                    <SelectTrigger className="h-9 text-sm flex-1">
                      <SelectValue placeholder="월" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={currentData.events.birthdayDay}
                    onValueChange={(value) =>
                      setCurrentData({
                        ...currentData,
                        events: {
                          ...currentData.events,
                          birthdayDay: value,
                        },
                      })
                    }
                    disabled={isPassedAway}
                  >
                    <SelectTrigger className="h-9 text-sm flex-1">
                      <SelectValue placeholder="일" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* 결혼기념일 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`anniversary-event-${activeTab}`}
                checked={currentData.events.anniversaryEnabled}
                onCheckedChange={(checked) =>
                  setCurrentData({
                    ...currentData,
                    events: {
                      ...currentData.events,
                      anniversaryEnabled: checked === true,
                    },
                  })
                }
                disabled={isPassedAway}
              />
              <label htmlFor={`anniversary-event-${activeTab}`} className="text-sm cursor-pointer">
                결혼기념일
              </label>
            </div>
            {currentData.events.anniversaryEnabled && (
              <div className="ml-6 flex gap-2">
                <Select
                  value={currentData.events.anniversaryMonth}
                  onValueChange={(value) =>
                    setCurrentData({
                      ...currentData,
                      events: {
                        ...currentData.events,
                        anniversaryMonth: value,
                      },
                    })
                  }
                  disabled={isPassedAway}
                >
                  <SelectTrigger className="h-9 text-sm flex-1">
                    <SelectValue placeholder="월" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={currentData.events.anniversaryDay}
                  onValueChange={(value) =>
                    setCurrentData({
                      ...currentData,
                      events: {
                        ...currentData.events,
                        anniversaryDay: value,
                      },
                    })
                  }
                  disabled={isPassedAway}
                >
                  <SelectTrigger className="h-9 text-sm flex-1">
                    <SelectValue placeholder="일" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 기타 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`other-event-${activeTab}`}
                checked={currentData.events.otherEnabled}
                onCheckedChange={(checked) =>
                  setCurrentData({
                    ...currentData,
                    events: {
                      ...currentData.events,
                      otherEnabled: checked === true,
                    },
                  })
                }
                disabled={isPassedAway}
              />
              <label htmlFor={`other-event-${activeTab}`} className="text-sm cursor-pointer">
                기타
              </label>
            </div>
            {currentData.events.otherEnabled && (
              <div className="ml-6 space-y-2">
                <Input
                  type="text"
                  placeholder="이벤트 이름 (예: 수술일)"
                  value={currentData.events.otherName}
                  onChange={(e) =>
                    setCurrentData({
                      ...currentData,
                      events: {
                        ...currentData.events,
                        otherName: e.target.value,
                      },
                    })
                  }
                  className="h-9 text-sm"
                  disabled={isPassedAway}
                />
                <Input
                  type="date"
                  value={currentData.events.otherDate}
                  onChange={(e) =>
                    setCurrentData({
                      ...currentData,
                      events: {
                        ...currentData.events,
                        otherDate: e.target.value,
                      },
                    })
                  }
                  className="h-9 text-sm"
                  disabled={isPassedAway}
                />
              </div>
            )}
          </div>
        </Card>

        {/* 돌아가심 체크박스 */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`passed-away-${activeTab}`}
              checked={currentData.passedAway}
              onCheckedChange={(checked) =>
                setCurrentData({
                  ...currentData,
                  passedAway: checked === true,
                })
              }
            />
            <label htmlFor={`passed-away-${activeTab}`} className="text-sm cursor-pointer text-gray-500">
              고인이 되셨습니다
            </label>
          </div>
        </Card>
      </div>

      {/* 하단 버튼 */}
      <div className="p-4 space-y-2 shrink-0 bg-white border-t">
        <Button
          onClick={handleSubmit}
          disabled={
            isSaving ||
            // 둘 다 돌아가셨거나, 살아계신 분의 이름이 없으면 비활성화
            (motherData.passedAway && fatherData.passedAway) ||
            ((!motherData.name || motherData.passedAway) && (!fatherData.name || fatherData.passedAway))
          }
          className="h-11 w-full bg-todak-orange text-sm font-semibold hover:bg-todak-orange/90"
        >
          {isSaving ? "저장 중..." : "저장하기"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="h-10 w-full text-gray-600 text-sm"
        >
          나중에 입력하기
        </Button>
      </div>
    </div>
  );
}
