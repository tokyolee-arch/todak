"use client";

import { useState } from "react";
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

export default function ParentInfo() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<"mother" | "father">("mother");
  const [motherData, setMotherData] = useState<ParentData>({ ...initialParentData });
  const [fatherData, setFatherData] = useState<ParentData>({ ...initialParentData });

  const isPassedAway = activeTab === "mother" ? motherData.passedAway : fatherData.passedAway;

  const handleSubmit = async () => {
    const supabase = createClient();
    if (!user || !supabase) return;

    const typedSupabase = supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => Promise<unknown> } };

    try {
      // 돌아가시지 않은 부모님만 저장
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

      router.push("/onboarding/recording-consent");
    } catch (error) {
      console.error("Error saving parent info:", error);
    }
  };

  const currentData = activeTab === "mother" ? motherData : fatherData;
  const setCurrentData = activeTab === "mother" ? setMotherData : setFatherData;

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="p-4 shrink-0">
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
            // 둘 다 돌아가셨거나, 살아계신 분의 이름이 없으면 비활성화
            (motherData.passedAway && fatherData.passedAway) ||
            ((!motherData.name || motherData.passedAway) && (!fatherData.name || fatherData.passedAway))
          }
          className="h-11 w-full bg-todak-orange text-sm font-semibold hover:bg-todak-orange/90"
        >
          다음
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/onboarding/recording-consent")}
          className="h-10 w-full text-gray-600 text-sm"
        >
          나중에 입력하기
        </Button>
      </div>
    </div>
  );
}
