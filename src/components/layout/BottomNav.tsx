"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "홈", icon: "🏠" },
  { path: "/history", label: "대화", icon: "💬" },
  { path: "/settings", label: "설정", icon: "⚙️" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className="sticky bottom-0 left-0 right-0 z-50 border-t border-gray-200/90 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.04)]"
      aria-label="하단 메뉴"
    >
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const isActive =
            tab.path === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => router.push(tab.path)}
              className={cn(
                "flex min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-lg transition-colors py-1",
                isActive ? "text-todak-brown font-medium" : "text-gray-400"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-xl" aria-hidden>
                {tab.icon}
              </span>
              <span className={cn("text-xs", isActive && "font-semibold")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
