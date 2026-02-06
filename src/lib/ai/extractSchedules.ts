import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedSchedule } from "@/types";

// API 키가 없으면 null 반환
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  : null;

export interface ExtractionResult {
  summary: string;
  keywords: string[];
  mood: "good" | "neutral" | "concerned";
  schedules: ExtractedSchedule[];
}

/**
 * AI를 사용하여 통화 텍스트에서 일정을 추출합니다.
 * API 키가 없으면 시뮬레이션 결과를 반환합니다.
 */
export async function extractSchedulesFromConversation(
  conversationText: string,
  parentName: string
): Promise<ExtractionResult> {
  // API 키가 없으면 시뮬레이션 모드 사용
  if (!anthropic) {
    console.log("ANTHROPIC_API_KEY not found, using simulation mode");
    return simulateExtraction(conversationText, parentName);
  }

  const today = new Date().toISOString().split("T")[0];

  const prompt = `다음은 자녀와 부모(${parentName})의 통화 내용입니다. 이 대화에서 향후 확인해야 할 일정이나 약속을 추출해주세요.

[통화 내용]
${conversationText}

다음 형식의 JSON만 반환해주세요 (코드 블록 없이):

{
  "summary": "통화 내용을 3줄로 요약",
  "keywords": ["주요", "키워드", "최대5개"],
  "mood": "good" | "neutral" | "concerned",
  "schedules": [
    {
      "type": "hospital" | "meeting" | "follow_up" | "check_event" | "send_gift" | "confirm_delivery",
      "topic": "확인할 일정 제목 (예: 병원 검사 결과 확인)",
      "dueDate": "YYYY-MM-DD 형식의 날짜",
      "reason": "왜 이 일정을 확인해야 하는지",
      "confidence": 0.9
    }
  ]
}

일정 추출 규칙:
1. 구체적인 날짜나 일정이 언급된 경우 반드시 추출
2. "다음 주 화요일", "다음 달 3일" 같은 상대적 날짜는 오늘(${today}) 기준으로 절대 날짜로 변환
3. 병원 예약, 검사 결과, 친구 만남, 여행, 선물 배송 등 모두 포함
4. 애매한 일정("언젠가", "나중에")은 제외
5. confidence: 날짜가 명확하면 0.9-1.0, 추정이면 0.5-0.8

타입 분류:
- hospital: 병원, 검진, 건강 관련
- meeting: 친구 만남, 동창회, 모임, 방문
- follow_up: "결과 알려달라", "끝나면 전화해", 안부 확인
- check_event: 결혼식, 생일, 기념일 등 특정 이벤트
- send_gift: 선물 준비, 용돈
- confirm_delivery: 택배, 배송 확인`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // JSON 파싱 (코드 블록이 있을 수도 있고 없을 수도 있음)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // JSON 문자열 정리
    jsonText = jsonText.trim();
    if (jsonText.startsWith("{") && jsonText.endsWith("}")) {
      // valid JSON object
    } else {
      // 첫 번째 { 부터 마지막 } 까지 추출
      const startIdx = jsonText.indexOf("{");
      const endIdx = jsonText.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1) {
        jsonText = jsonText.substring(startIdx, endIdx + 1);
      }
    }

    const result = JSON.parse(jsonText);

    // ID 생성 및 selected 필드 추가
    const schedulesWithIds: ExtractedSchedule[] = result.schedules.map(
      (schedule: Omit<ExtractedSchedule, "id" | "selected">, index: number) => ({
        ...schedule,
        id: `schedule-${Date.now()}-${index}`,
        selected: false,
      })
    );

    return {
      summary: result.summary,
      keywords: result.keywords,
      mood: result.mood as ExtractionResult["mood"],
      schedules: schedulesWithIds,
    };
  } catch (error) {
    console.error("AI extraction failed, falling back to simulation:", error);
    return simulateExtraction(conversationText, parentName);
  }
}

/**
 * AI 없이 키워드 기반으로 일정을 시뮬레이션 추출합니다.
 */
function simulateExtraction(
  conversationText: string,
  parentName: string
): ExtractionResult {
  const schedules: ExtractedSchedule[] = [];
  const keywords: string[] = [];
  const today = new Date();

  // 병원/건강 관련 패턴
  const hospitalPatterns = [
    /병원|진료|검사|수술|주사|약|처방|정형외과|내과|치과/g,
    /건강검진|콜레스테롤|혈압|관절|무릎/g,
  ];
  let hasHospital = false;
  for (const pattern of hospitalPatterns) {
    if (pattern.test(conversationText)) {
      hasHospital = true;
      break;
    }
  }
  if (hasHospital) {
    keywords.push("병원");
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7);
    schedules.push({
      id: `sim-hospital-${Date.now()}`,
      type: "hospital",
      topic: `${parentName} 병원 방문 확인`,
      dueDate: futureDate.toISOString().split("T")[0],
      reason: "통화에서 언급된 병원/건강 관련 일정을 확인하세요",
      confidence: 0.85,
      selected: false,
    });
  }

  // 이벤트 관련 패턴
  if (/결혼|생일|생신|돌잔치|회갑|칠순|결혼식/.test(conversationText)) {
    keywords.push("이벤트");
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 14);
    schedules.push({
      id: `sim-event-${Date.now()}`,
      type: "check_event",
      topic: "가족 이벤트 참석",
      dueDate: futureDate.toISOString().split("T")[0],
      reason: "통화에서 언급된 중요한 가족 이벤트입니다",
      confidence: 0.9,
      selected: false,
    });
  }

  // 모임 관련 패턴
  if (/동창회|모임|만나|방문|놀러|식사|저녁/.test(conversationText)) {
    keywords.push("모임");
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 5);
    schedules.push({
      id: `sim-meeting-${Date.now()}`,
      type: "meeting",
      topic: "모임/방문 일정",
      dueDate: futureDate.toISOString().split("T")[0],
      reason: "통화에서 약속한 모임 또는 방문 일정",
      confidence: 0.8,
      selected: false,
    });
  }

  // 선물 관련 패턴
  if (/선물|보내|택배|사드|용돈|김치|깍두기/.test(conversationText)) {
    keywords.push("선물");
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 3);
    schedules.push({
      id: `sim-gift-${Date.now()}`,
      type: "send_gift",
      topic: "선물/택배 준비",
      dueDate: futureDate.toISOString().split("T")[0],
      reason: "통화에서 언급된 선물 또는 보내드릴 것 준비",
      confidence: 0.75,
      selected: false,
    });
  }

  // 설날/명절 관련 패턴
  if (/설날|추석|명절|전|차례|제사/.test(conversationText)) {
    keywords.push("명절");
  }

  // 팔로업 전화 추가
  if (schedules.length > 0) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);
    schedules.push({
      id: `sim-followup-${Date.now()}`,
      type: "follow_up",
      topic: `${parentName} 안부 전화`,
      dueDate: futureDate.toISOString().split("T")[0],
      reason: "정기적인 안부 확인 전화",
      confidence: 0.6,
      selected: false,
    });
  }

  // 분위기 판단
  let mood: ExtractionResult["mood"] = "neutral";
  if (/좋아|기뻐|감사|고마워|행복/.test(conversationText)) {
    mood = "good";
  } else if (/아프|걱정|힘들|슬프|안 좋/.test(conversationText)) {
    mood = "concerned";
  }

  // 요약 생성
  const summary = generateSimpleSummary(conversationText, parentName, keywords);

  return {
    summary,
    keywords: keywords.slice(0, 5),
    mood,
    schedules,
  };
}

/**
 * 간단한 요약 생성
 */
function generateSimpleSummary(
  text: string,
  parentName: string,
  keywords: string[]
): string {
  const keywordText = keywords.length > 0 ? keywords.join(", ") : "일상";
  const lineCount = text.split("\n").filter((l) => l.trim()).length;

  return `${parentName}와(과)의 통화 내용입니다. 주요 키워드: ${keywordText}. 약 ${lineCount}개의 대화가 오갔습니다.`;
}
