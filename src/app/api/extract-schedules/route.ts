import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractSchedulesFromConversation } from "@/lib/ai/extractSchedules";

// 서버 사이드 Supabase 클라이언트 (Service Role Key 사용)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 환경변수가 없거나 placeholder 값인 경우 null 반환
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  // placeholder 값 감지 (your_, _here, example 등)
  if (
    supabaseServiceKey.includes("your_") ||
    supabaseServiceKey.includes("_here") ||
    supabaseServiceKey.includes("example") ||
    supabaseServiceKey.length < 50 // 실제 키는 매우 김
  ) {
    console.log("Supabase service key appears to be a placeholder, using demo mode");
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

interface ConversationWithParent {
  id: string;
  parent_id: string;
  transcript: string | null;
  parents: {
    id: string;
    name: string;
  } | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, conversationText, parentName: inputParentName, demoMode } = body;

    // 데모 모드: conversationText가 직접 전달된 경우
    if (demoMode && conversationText) {
      console.log("Running in demo mode with direct conversation text");
      
      const parentName = inputParentName || "부모님";
      
      // AI로 일정 추출 (시뮬레이션 포함)
      const result = await extractSchedulesFromConversation(
        conversationText,
        parentName
      );

      return NextResponse.json({
        success: true,
        data: {
          conversationId: null,
          parentId: null,
          parentName,
          summary: result.summary,
          keywords: result.keywords,
          mood: result.mood,
          schedules: result.schedules,
        },
      });
    }

    // 정상 모드: conversationId로 데이터베이스에서 조회
    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId or conversationText is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured. Please use demo mode or set up environment variables." },
        { status: 500 }
      );
    }

    // 1. Conversation 조회 (parents 조인)
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select(
        `
        id,
        parent_id,
        transcript,
        parents (
          id,
          name
        )
      `
      )
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      console.error("Conversation fetch error:", convError);
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const conv = conversation as unknown as ConversationWithParent;

    if (!conv.transcript) {
      return NextResponse.json(
        { error: "Conversation has no transcript" },
        { status: 400 }
      );
    }

    const parentName = conv.parents?.name || "부모님";

    // 2. AI로 일정 추출
    const result = await extractSchedulesFromConversation(
      conv.transcript,
      parentName
    );

    // 3. Conversation 업데이트 (요약, 키워드, 분위기)
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        summary: result.summary,
        // keywords와 mood는 테이블에 컬럼이 없을 수 있으므로 주석 처리
        // keywords: result.keywords,
        // mood: result.mood,
      })
      .eq("id", conversationId);

    if (updateError) {
      console.error("Conversation update error:", updateError);
      // 업데이트 실패해도 추출 결과는 반환
    }

    // 4. 결과 반환
    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        parentId: conv.parent_id,
        parentName,
        summary: result.summary,
        keywords: result.keywords,
        mood: result.mood,
        schedules: result.schedules,
      },
    });
  } catch (error) {
    console.error("Error extracting schedules:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
