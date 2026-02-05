import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AnalysisResult {
  summary: string;
  keywords: string[];
  mood: "good" | "neutral" | "concerned";
  parentSentiment: string;
  nextActions: Array<{
    type: string;
    topic: string;
    dueDays: number;
    reason: string;
  }>;
  interrupted: boolean;
  durationMinutes: number;
}

async function transcribeAudio(
  supabaseUrl: string,
  serviceRoleKey: string,
  recordingPath: string
): Promise<string> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: blob, error: downloadError } = await supabase.storage
    .from("recordings")
    .download(recordingPath);

  if (downloadError || !blob) {
    throw new Error("Recording download failed: " + (downloadError?.message ?? "no data"));
  }

  const formData = new FormData();
  formData.append("file", blob, "audio.webm");
  formData.append("model", "whisper-1");
  formData.append("language", "ko");

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("OPENAI_API_KEY not set");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper API error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as { text?: string };
  return data.text ?? "";
}

async function analyzeWithClaude(
  transcript: string,
  parentName: string,
  relationship: string
): Promise<AnalysisResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const system = `당신은 40대 자녀가 70대 부모님과 나눈 통화를 분석하는 AI입니다.
다음 원칙을 지키세요:
- 다음 연락에서 자연스럽게 이어갈 수 있는 구체적인 액션만 제안
- 부모님이 언급한 건강, 병원 일정, 약속, 배송·선물 등을 놓치지 말 것
- JSON만 반환하고 다른 설명은 붙이지 말 것`;

  const prompt = `다음은 40대 남성과 70대 ${relationship}(이름: ${parentName})의 통화 내용입니다. 분석해주세요.

[통화 내용]
${transcript}

아래 형식으로 JSON만 반환해주세요 (다른 텍스트 없이):
{
  "summary": "통화 내용을 3줄 이내로 요약",
  "keywords": ["주요", "키워드", "5개 이하"],
  "mood": "good" | "neutral" | "concerned",
  "parentSentiment": "부모님의 감정/컨디션 한 줄 설명",
  "nextActions": [
    {
      "type": "follow_up" | "check_event" | "send_gift" | "confirm_delivery",
      "topic": "확인할 주제",
      "dueDays": 7,
      "reason": "이 액션이 필요한 이유"
    }
  ],
  "interrupted": false,
  "durationMinutes": 0
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${err}`);
  }

  const result = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = result.content?.[0]?.type === "text" ? result.content[0].text : "";
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonText = (jsonMatch ? jsonMatch[1] : text).trim();
  return JSON.parse(jsonText) as AnalysisResult;
}

serve(async (req) => {
  try {
    const { conversationId } = (await req.json()) as { conversationId?: string };
    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*, parents(*)")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error("Conversation not found");
    }

    const parent = conversation.parents as { name: string; relationship: string } | null;
    if (!parent) {
      throw new Error("Parent not found");
    }

    let transcript = "";
    if (conversation.recording_url) {
      transcript = await transcribeAudio(
        supabaseUrl,
        serviceRoleKey,
        conversation.recording_url
      );
    }

    let analysis: AnalysisResult;
    if (transcript.trim()) {
      analysis = await analyzeWithClaude(
        transcript,
        parent.name,
        parent.relationship
      );
    } else {
      analysis = {
        summary: "녹음이 없어 분석할 수 없습니다.",
        keywords: [],
        mood: "neutral",
        parentSentiment: "",
        nextActions: [],
        interrupted: false,
        durationMinutes: conversation.duration_minutes ?? 0,
      };
    }

    await supabase
      .from("conversations")
      .update({
        transcript: transcript || null,
        summary: analysis.summary,
        keywords: analysis.keywords,
        mood: analysis.mood,
        parent_sentiment: analysis.parentSentiment,
        interrupted: analysis.interrupted,
      })
      .eq("id", conversationId);

    for (const action of analysis.nextActions) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + action.dueDays);
      await supabase.from("actions").insert({
        conversation_id: conversationId,
        parent_id: conversation.parent_id,
        type: action.type,
        topic: action.topic,
        reason: action.reason,
        due_date: dueDate.toISOString().split("T")[0],
        completed: false,
      });
    }

    if (conversation.recording_url) {
      await supabase.storage
        .from("recordings")
        .remove([conversation.recording_url]);
      await supabase
        .from("conversations")
        .update({ recording_url: null })
        .eq("id", conversationId);
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
