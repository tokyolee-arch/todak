import Anthropic from "@anthropic-ai/sdk";

const anthropic =
  process.env.ANTHROPIC_API_KEY ?
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface AnalysisResult {
  summary: string;
  keywords: string[];
  mood: "good" | "neutral" | "concerned";
  parentSentiment: string;
  nextActions: Array<{
    type: "follow_up" | "check_event" | "send_gift" | "confirm_delivery";
    topic: string;
    dueDays: number;
    reason: string;
  }>;
  interrupted: boolean;
  durationMinutes: number;
}

const ANALYSIS_SYSTEM = `당신은 40대 자녀가 70대 부모님과 나눈 통화를 분석하는 AI입니다.
다음 원칙을 지키세요:
- 다음 연락에서 자연스럽게 이어갈 수 있는 구체적인 액션만 제안
- 부모님이 언급한 건강, 병원 일정, 약속, 배송·선물 등을 놓치지 말 것
- JSON만 반환하고 다른 설명은 붙이지 말 것`;

export async function analyzeConversation(
  transcript: string,
  parentName: string,
  relationship: string
): Promise<AnalysisResult> {
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

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

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: ANALYSIS_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  const responseText =
    block.type === "text" ? block.text : "";

  const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonText = (jsonMatch ? jsonMatch[1] : responseText).trim();

  return JSON.parse(jsonText) as AnalysisResult;
}

/**
 * OpenAI Whisper API로 오디오 URL을 텍스트로 변환.
 * audioUrl: 접근 가능한 오디오 파일 URL (Supabase Storage signed URL 등)
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
  }
  const blob = await audioResponse.blob();

  const formData = new FormData();
  formData.append("file", blob, "audio.webm");
  formData.append("model", "whisper-1");
  formData.append("language", "ko");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper API error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as { text?: string };
  return data.text ?? "";
}
