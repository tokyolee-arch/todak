import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { PhoneFrame } from "@/components/layout/PhoneFrame";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TODAK - 부모님과의 소통을 돕는 AI 비서",
  description: "AI가 부모님과의 대화를 기억하고 관리해드립니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <PhoneFrame>{children}</PhoneFrame>
      </body>
    </html>
  );
}
