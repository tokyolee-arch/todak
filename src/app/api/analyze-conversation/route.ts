import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 분석 API - Edge Function 호출 또는 직접 mock 응답
 * Service Role Key가 없으면 기본 분석 결과를 생성합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId } = body as { conversationId?: string };

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: "Supabase 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // Service Role Key가 있으면 Edge Function 호출
    if (serviceRoleKey && serviceRoleKey !== "your_service_role_key_here") {
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/analyze-conversation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ conversationId }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
        // Edge Function 실패 시 fallback으로 진행
        console.warn("Edge Function failed, using fallback analysis");
      } catch (edgeFnError) {
        console.warn("Edge Function error:", edgeFnError);
      }
    }

    // Fallback: 직접 mock 분석 결과 생성 (개발/테스트용)
    const supabase = createClient(supabaseUrl, anonKey);

    // 기본 분석 결과로 conversation 업데이트
    const mockAnalysis = {
      summary: "통화가 완료되었습니다. (실제 AI 분석을 위해 SUPABASE_SERVICE_ROLE_KEY와 Edge Function 배포가 필요합니다)",
      mood: "neutral" as const,
      parent_sentiment: "통화 상태 분석을 위해 AI 설정이 필요합니다.",
      keywords: ["통화", "완료"],
    };

    const { error: updateError } = await supabase
      .from("conversations")
      .update(mockAnalysis)
      .eq("id", conversationId);

    if (updateError) {
      console.error("Failed to update conversation:", updateError);
      return NextResponse.json(
        { error: `분석 결과 저장 실패: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      mock: true,
      message: "개발 모드: 기본 분석 결과가 저장되었습니다." 
    });
  } catch (error) {
    console.error("Analyze conversation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
