"use client";

import { ReactNode, useState, useEffect } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

/**
 * 안드로이드 스탠다드 사이즈 폰 프레임 (360x800px)
 * 웹에서 모바일 앱처럼 보이도록 폰 테두리를 표시합니다.
 */
export function PhoneFrame({ children }: PhoneFrameProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000); // 10초마다 갱신
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      {/* 폰 외부 프레임 */}
      <div className="relative">
        {/* 폰 본체 */}
        <div className="relative w-[380px] h-[820px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
          {/* 상단 스피커/카메라 영역 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-20 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-700" />
            <div className="w-16 h-1.5 rounded-full bg-gray-700" />
          </div>
          
          {/* 전원 버튼 */}
          <div className="absolute -right-1 top-28 w-1 h-16 bg-gray-700 rounded-r-sm" />
          
          {/* 볼륨 버튼 */}
          <div className="absolute -left-1 top-24 w-1 h-10 bg-gray-700 rounded-l-sm" />
          <div className="absolute -left-1 top-36 w-1 h-10 bg-gray-700 rounded-l-sm" />

          {/* 스크린 영역 */}
          <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
            {/* 상단 상태바 */}
            <div className="h-7 bg-gray-900 flex items-center justify-between px-6 text-white text-xs">
              <span>{time || "\u00A0"}</span>
              <div className="flex items-center gap-1">
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>
            
            {/* 앱 컨텐츠 영역 */}
            <div className="h-[calc(100%-28px)] overflow-y-auto overflow-x-hidden scrollbar-hide">
              {children}
            </div>
          </div>
        </div>

        {/* 폰 그림자 효과 */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/20 blur-xl rounded-full" />
      </div>
    </div>
  );
}
