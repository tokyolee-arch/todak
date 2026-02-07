"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/authStore";
import { BottomNav } from "@/components/layout/BottomNav";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [demoActions, setDemoActions] = useState<Array<{
    id: string;
    topic: string;
    due_date: string;
    type: string;
  }>>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // 데모 모드: localStorage에서 액션 로드
    const storedActions = localStorage.getItem("demoActions");
    if (storedActions) {
      try {
        const actions = JSON.parse(storedActions);
        // 완료되지 않은 액션만 표시 (최대 3개)
        const pendingActions = actions
          .filter((a: { completed: boolean }) => !a.completed)
          .slice(0, 3);
        setDemoActions(pendingActions);
      } catch (e) {
        console.error("Error loading demo actions:", e);
      }
    }
  }, [user, router]);

  const menuItems = [
    {
      id: "call-input",
      title: "통화내용 살펴보기",
      description: "통화 내용을 입력하고 AI 분석을 받습니다",
      icon: "📞",
      color: "bg-todak-orange/10 border-todak-orange",
      iconBg: "bg-todak-orange/20",
      onClick: () => router.push("/call/demo/input"),
      highlight: true,
    },
    {
      id: "parent-info",
      title: "부모님 정보 입력",
      description: "부모님 정보를 등록하고 관리합니다",
      icon: "👨‍👩‍👧",
      color: "bg-blue-50 border-blue-200",
      iconBg: "bg-blue-100",
      onClick: () => router.push("/onboarding/parent-info"),
    },
    {
      id: "conversations",
      title: "이전 대화 내용",
      description: "부모님과의 대화 기록을 확인합니다",
      icon: "💬",
      color: "bg-green-50 border-green-200",
      iconBg: "bg-green-100",
      onClick: () => router.push("/history"),
    },
    {
      id: "schedules",
      title: "다음 일정 목록",
      description: "예정된 일정과 할 일을 확인합니다",
      icon: "📅",
      color: "bg-purple-50 border-purple-200",
      iconBg: "bg-purple-100",
      onClick: () => router.push("/history"),
      badge: demoActions.length > 0 ? demoActions.length : undefined,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-todak-cream">
      {/* 헤더 */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Image
            src="/images/todak-logo.png"
            alt="TODAK"
            width={100}
            height={32}
            className="object-contain"
          />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          안녕하세요, {user?.displayName ?? user?.email?.split("@")[0] ?? "회원"}님!
        </p>
      </div>

      {/* 스크롤 가능한 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 상단 여백 - 추후 기능 추가 영역 */}
        <div className="h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
          <p className="text-sm text-gray-400">추가 기능 예정</p>
        </div>

        {/* 메뉴 카드들 */}
        {menuItems.map((item) => (
          <Card
            key={item.id}
            className={`p-4 border-2 cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${item.color} ${
              item.highlight ? "shadow-md" : ""
            }`}
            onClick={item.onClick}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                <span className="text-2xl">{item.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-base font-bold ${item.highlight ? "text-todak-orange" : "text-gray-800"}`}>
                    {item.title}
                  </h2>
                  {item.badge && (
                    <Badge className="bg-todak-orange text-white text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
              </div>
              <span className={`text-xl ${item.highlight ? "text-todak-orange" : "text-gray-400"}`}>›</span>
            </div>
          </Card>
        ))}

        {/* 다음 일정 미리보기 */}
        {demoActions.length > 0 && (
          <Card className="p-4 bg-white border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3">📌 다음 할 일</h3>
            <div className="space-y-2">
              {demoActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">• {action.topic}</span>
                  <Badge variant="outline" className="text-xs">
                    {new Date(action.due_date).toLocaleDateString("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}
