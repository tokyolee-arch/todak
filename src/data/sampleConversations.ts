// 샘플 통화 데이터 - 프로토타입용
import type { ExtractedSchedule, ConversationAnalysis } from "@/types";

export interface SampleConversation {
  id: string;
  title: string;
  parentType: "mother" | "father";
  conversationText: string;
  duration: number; // 분 단위
  date: string;
}

// 샘플 통화 데이터 (5개)
export const sampleConversations: SampleConversation[] = [
  {
    id: "conv-1",
    title: "어머니와의 일요일 통화",
    parentType: "mother",
    conversationText: `나: 어머니, 요즘 어떠세요?
어머니: 응, 그냥 그래. 요즘 무릎이 좀 아파서 병원에 다녀왔어.
나: 아이고, 많이 아프세요? 뭐라고 하던가요?
어머니: 관절염이래. 다음 주 화요일에 다시 오라고 하더라. 주사 맞으러.
나: 그러시구나... 제가 그날 모시고 갈까요?
어머니: 아니야, 아버지가 데려다 준대. 그리고 다음 달에 네 사촌 영희 결혼식 있잖아. 3월 15일인데 올 수 있어?
나: 아, 영희 결혼해요? 축하드려야겠네요. 네, 꼭 갈게요.
어머니: 그래, 그리고 요즘 뭐 먹고 싶은 거 있어? 이번 주말에 김치 담그려고 하는데.
나: 어머니 김치 너무 맛있죠. 깍두기도 해주시면 안 될까요?
어머니: 알았어. 깍두기도 해줄게. 택배로 보내줄게.`,
    duration: 15,
    date: "2024-02-04",
  },
  {
    id: "conv-2",
    title: "아버지와의 저녁 통화",
    parentType: "father",
    conversationText: `나: 아버지, 식사하셨어요?
아버지: 응, 방금 먹었어. 너는?
나: 저도 먹었어요. 요즘 건강은 어떠세요?
아버지: 괜찮아. 그런데 혈압약 다 떨어져가서 병원 가야 해. 이번 주 금요일에 가려고.
나: 아, 그러시구나. 제가 약 타러 같이 갈까요?
아버지: 아니야, 괜찮아. 혼자 갈 수 있어. 그리고 다음 주에 동창회가 있어서 서울 올라가.
나: 오, 동창회요? 언제요?
아버지: 2월 12일 월요일. 점심에 만나기로 했어. 오랜만에 친구들 보니까 좋더라.
나: 좋으시겠다. 서울 오시면 저녁에 같이 식사해요!
아버지: 그래, 그러자. 오랜만에 맛있는 거 먹자.`,
    duration: 10,
    date: "2024-02-05",
  },
  {
    id: "conv-3",
    title: "어머니 생신 관련 통화",
    parentType: "mother",
    conversationText: `나: 어머니, 다음 주가 생신이시잖아요!
어머니: 아이고, 나이 먹는 게 뭐가 좋다고.
나: 그래도 축하드려야죠. 뭐 드시고 싶은 거 있으세요?
어머니: 글쎄... 요즘 한우가 먹고 싶긴 하더라.
나: 그럼 생신날 한우 사드릴게요. 2월 10일 토요일 맞죠?
어머니: 응, 맞아. 근데 굳이 안 사도 돼.
나: 아니에요, 꼭 사드릴게요. 케이크도 준비할게요.
어머니: 알았어, 고마워. 그리고 너 감기 조심해. 요즘 독감 유행이래.
나: 네, 조심할게요. 어머니도 건강 챙기세요.
어머니: 그래, 따뜻하게 입고 다녀.`,
    duration: 8,
    date: "2024-02-03",
  },
  {
    id: "conv-4",
    title: "아버지 건강검진 후 통화",
    parentType: "father",
    conversationText: `나: 아버지, 건강검진 결과 나왔어요?
아버지: 응, 어제 받았어. 대체로 괜찮은데 콜레스테롤이 좀 높대.
나: 아이고, 그럼 식단 조절 좀 하셔야겠네요.
아버지: 그래서 의사가 다음 달에 다시 검사하자고 했어. 3월 5일에 예약했어.
나: 아, 그러시구나. 제가 그날 같이 갈게요. 기름진 음식 좀 줄이세요.
아버지: 알았어. 어머니가 요즘 나물 반찬 많이 해줘.
나: 어머니 감사하네요. 그리고 아버지, 다음 주 일요일에 집에 갈게요.
아버지: 오, 그래? 오랜만이네. 뭐 먹고 싶은 거 있어?
나: 어머니 잡채 먹고 싶어요!
아버지: 알았어, 어머니한테 말해둘게.`,
    duration: 12,
    date: "2024-02-06",
  },
  {
    id: "conv-5",
    title: "명절 준비 관련 통화",
    parentType: "mother",
    conversationText: `나: 어머니, 이번 설날에 뭐 도와드릴 거 있으세요?
어머니: 아이고, 넌 바쁜데 뭘. 그냥 와서 밥만 먹어.
나: 그래도 뭐라도 해야죠. 전 부치는 거 도와드릴까요?
어머니: 그래, 그럼 2월 9일 금요일에 와. 전 부치려고.
나: 네, 그날 갈게요. 차례는 몇 시에 지내요?
어머니: 2월 10일 아침 9시. 제사상은 내가 다 준비할 테니까 걱정 마.
나: 알겠어요. 그리고 이모 가족도 오세요?
어머니: 응, 이모네도 오고 삼촌네도 와. 오랜만에 다 모이네.
나: 좋겠다. 조카들 보고 싶었어요.
어머니: 그래, 용돈 좀 챙겨가. 조카들이 좋아해.`,
    duration: 10,
    date: "2024-02-07",
  },
];

// 샘플 대화 분석 결과 (각 대화에 대한 AI 분석 시뮬레이션)
export const sampleAnalysisResults: Record<string, ConversationAnalysis> = {
  "conv-1": {
    conversationId: "conv-1",
    parentId: "mother-1",
    originalText: sampleConversations[0].conversationText,
    summary: "어머니께서 무릎 관절염으로 병원 치료 중이시며, 다음 주 화요일 주사 맞으러 가심. 사촌 영희 결혼식이 3월 15일에 있고, 이번 주말 김치와 깍두기를 담가서 보내주시기로 함.",
    keywords: ["관절염", "병원", "결혼식", "김치", "택배"],
    mood: "neutral",
    extractedSchedules: [
      {
        id: "sch-1-1",
        type: "hospital",
        topic: "어머니 관절염 주사",
        dueDate: "2024-02-13",
        reason: "어머니께서 다음 주 화요일에 관절염 주사 맞으러 병원 가심",
        confidence: 0.95,
        selected: false,
      },
      {
        id: "sch-1-2",
        type: "check_event",
        topic: "사촌 영희 결혼식",
        dueDate: "2024-03-15",
        reason: "사촌 영희 결혼식 참석 예정",
        confidence: 0.9,
        selected: false,
      },
      {
        id: "sch-1-3",
        type: "follow_up",
        topic: "김치 택배 도착 확인",
        dueDate: "2024-02-10",
        reason: "어머니가 보내주시는 김치/깍두기 도착 후 감사 전화",
        confidence: 0.7,
        selected: false,
      },
    ],
    createdAt: new Date("2024-02-04"),
  },
  "conv-2": {
    conversationId: "conv-2",
    parentId: "father-1",
    originalText: sampleConversations[1].conversationText,
    summary: "아버지께서 혈압약이 떨어져서 금요일에 병원 가실 예정. 다음 주 월요일(2월 12일) 동창회로 서울 방문하시며, 저녁 식사 약속함.",
    keywords: ["혈압약", "병원", "동창회", "서울", "저녁 식사"],
    mood: "good",
    extractedSchedules: [
      {
        id: "sch-2-1",
        type: "hospital",
        topic: "아버지 혈압약 처방",
        dueDate: "2024-02-09",
        reason: "아버지께서 금요일에 혈압약 처방받으러 병원 가심",
        confidence: 0.92,
        selected: false,
      },
      {
        id: "sch-2-2",
        type: "meeting",
        topic: "아버지와 저녁 식사",
        dueDate: "2024-02-12",
        reason: "아버지 동창회 후 서울에서 함께 저녁 식사",
        confidence: 0.88,
        selected: false,
      },
      {
        id: "sch-2-3",
        type: "follow_up",
        topic: "혈압약 복용 확인",
        dueDate: "2024-02-11",
        reason: "병원 다녀오신 후 약 잘 복용하시는지 확인",
        confidence: 0.75,
        selected: false,
      },
    ],
    createdAt: new Date("2024-02-05"),
  },
  "conv-3": {
    conversationId: "conv-3",
    parentId: "mother-1",
    originalText: sampleConversations[2].conversationText,
    summary: "어머니 생신이 2월 10일 토요일. 한우와 케이크를 선물로 준비하기로 함. 독감 유행 시즌이라 건강 조심하라고 당부하심.",
    keywords: ["생신", "한우", "케이크", "선물", "독감"],
    mood: "good",
    extractedSchedules: [
      {
        id: "sch-3-1",
        type: "send_gift",
        topic: "어머니 생신 선물",
        dueDate: "2024-02-10",
        reason: "어머니 생신에 한우와 케이크 선물 준비",
        confidence: 0.98,
        selected: false,
      },
      {
        id: "sch-3-2",
        type: "follow_up",
        topic: "건강 안부 전화",
        dueDate: "2024-02-08",
        reason: "독감 시즌 부모님 건강 확인",
        confidence: 0.65,
        selected: false,
      },
    ],
    createdAt: new Date("2024-02-03"),
  },
  "conv-4": {
    conversationId: "conv-4",
    parentId: "father-1",
    originalText: sampleConversations[3].conversationText,
    summary: "아버지 건강검진 결과 콜레스테롤이 높아 다음 달 3월 5일 재검사 예정. 다음 주 일요일에 집 방문하기로 함. 잡채 해달라고 요청.",
    keywords: ["건강검진", "콜레스테롤", "재검사", "방문", "잡채"],
    mood: "neutral",
    extractedSchedules: [
      {
        id: "sch-4-1",
        type: "hospital",
        topic: "아버지 콜레스테롤 재검사",
        dueDate: "2024-03-05",
        reason: "콜레스테롤 수치 재검사를 위해 병원 동행",
        confidence: 0.93,
        selected: false,
      },
      {
        id: "sch-4-2",
        type: "meeting",
        topic: "부모님 댁 방문",
        dueDate: "2024-02-11",
        reason: "다음 주 일요일 부모님 댁 방문",
        confidence: 0.9,
        selected: false,
      },
      {
        id: "sch-4-3",
        type: "follow_up",
        topic: "식단 관리 확인",
        dueDate: "2024-02-20",
        reason: "아버지 콜레스테롤 관리 위한 식단 조절 잘 하시는지 확인",
        confidence: 0.6,
        selected: false,
      },
    ],
    createdAt: new Date("2024-02-06"),
  },
  "conv-5": {
    conversationId: "conv-5",
    parentId: "mother-1",
    originalText: sampleConversations[4].conversationText,
    summary: "설날 준비 관련 통화. 2월 9일 금요일에 전 부치러 가고, 2월 10일 아침 9시에 차례 지냄. 이모네, 삼촌네 가족도 모임. 조카 용돈 챙기기.",
    keywords: ["설날", "전", "차례", "가족 모임", "용돈"],
    mood: "good",
    extractedSchedules: [
      {
        id: "sch-5-1",
        type: "meeting",
        topic: "설날 전 부치기",
        dueDate: "2024-02-09",
        reason: "어머니 전 부치기 도와드리러 방문",
        confidence: 0.95,
        selected: false,
      },
      {
        id: "sch-5-2",
        type: "check_event",
        topic: "설날 차례",
        dueDate: "2024-02-10",
        reason: "설날 차례 참석 (아침 9시)",
        confidence: 0.98,
        selected: false,
      },
      {
        id: "sch-5-3",
        type: "send_gift",
        topic: "조카 용돈 준비",
        dueDate: "2024-02-08",
        reason: "설날 조카들 용돈 준비",
        confidence: 0.8,
        selected: false,
      },
    ],
    createdAt: new Date("2024-02-07"),
  },
};

// 텍스트에서 일정 추출하는 함수 (시뮬레이션)
export function extractSchedulesFromText(
  text: string,
  parentId: string
): ExtractedSchedule[] {
  const schedules: ExtractedSchedule[] = [];
  const today = new Date();

  // 병원/건강 관련 패턴
  if (/병원|진료|검사|수술|주사|약|처방/.test(text)) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7);
    schedules.push({
      id: `extracted-hospital-${Date.now()}`,
      type: "hospital",
      topic: "병원 방문 확인",
      dueDate: futureDate.toISOString().split("T")[0],
      reason: "통화에서 언급된 병원/건강 관련 일정",
      confidence: 0.85,
      selected: false,
    });
  }

  // 이벤트 관련 패턴
  if (/결혼|생일|생신|돌잔치|회갑|칠순/.test(text)) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 14);
    schedules.push({
      id: `extracted-event-${Date.now()}`,
      type: "check_event",
      topic: "가족 이벤트",
      dueDate: futureDate.toISOString().split("T")[0],
      reason: "통화에서 언급된 가족 이벤트",
      confidence: 0.9,
      selected: false,
    });
  }

  // 모임 관련 패턴
  if (/동창회|모임|만나|방문|놀러/.test(text)) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 5);
    schedules.push({
      id: `extracted-meeting-${Date.now()}`,
      type: "meeting",
      topic: "모임/방문 일정",
      dueDate: futureDate.toISOString().split("T")[0],
      reason: "통화에서 언급된 모임 또는 방문 일정",
      confidence: 0.8,
      selected: false,
    });
  }

  // 선물 관련 패턴
  if (/선물|보내|택배|사드|용돈/.test(text)) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 3);
    schedules.push({
      id: `extracted-gift-${Date.now()}`,
      type: "send_gift",
      topic: "선물/택배 준비",
      dueDate: futureDate.toISOString().split("T")[0],
      reason: "통화에서 언급된 선물 또는 택배 관련",
      confidence: 0.75,
      selected: false,
    });
  }

  // 팔로업 전화 (기본)
  if (schedules.length > 0) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);
    schedules.push({
      id: `extracted-followup-${Date.now()}`,
      type: "follow_up",
      topic: "안부 전화",
      dueDate: futureDate.toISOString().split("T")[0],
      reason: "주기적인 안부 확인",
      confidence: 0.6,
      selected: false,
    });
  }

  return schedules;
}

// 일정 타입별 설정
export const scheduleTypeConfig: Record<
  ExtractedSchedule["type"],
  { icon: string; label: string; color: string }
> = {
  follow_up: { icon: "📞", label: "안부 전화", color: "bg-blue-100 text-blue-700" },
  check_event: { icon: "🎉", label: "이벤트", color: "bg-purple-100 text-purple-700" },
  send_gift: { icon: "🎁", label: "선물", color: "bg-pink-100 text-pink-700" },
  confirm_delivery: { icon: "📦", label: "배송 확인", color: "bg-orange-100 text-orange-700" },
  hospital: { icon: "🏥", label: "병원", color: "bg-red-100 text-red-700" },
  meeting: { icon: "🤝", label: "모임", color: "bg-green-100 text-green-700" },
};

// 우선순위별 색상
export const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "높음", color: "bg-red-500" },
  medium: { label: "보통", color: "bg-yellow-500" },
  low: { label: "낮음", color: "bg-gray-400" },
};

// confidence를 우선순위로 변환
export function confidenceToPriority(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.65) return "medium";
  return "low";
}
