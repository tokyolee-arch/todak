export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

export interface Parent {
  id: string;
  userId: string;
  name: string;
  relationship: "mother" | "father" | "other";
  birthday?: Date;
  phone?: string;
  profileImageUrl?: string;
  minContactIntervalDays: number;
}

export interface Conversation {
  id: string;
  parentId: string;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
  mood?: "good" | "neutral" | "concerned";
  parentSentiment?: string;
  summary?: string;
  keywords?: string[];
  interrupted: boolean;
  transcript?: string;
}

export interface Action {
  id: string;
  conversationId?: string;
  parentId: string;
  type: "follow_up" | "check_event" | "send_gift" | "confirm_delivery" | "hospital" | "meeting";
  topic: string;
  reason?: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
  confidence?: number; // AI 추출 확신도 (0-1)
  selected?: boolean; // 사용자 선택 여부
}

export interface NotificationData {
  id: string;
  userId: string;
  parentId?: string;
  actionId?: string;
  type: "action_due" | "call_incomplete" | "periodic" | "event_trigger";
  title: string;
  message: string;
  scheduledFor: Date;
  sentAt?: Date;
  readAt?: Date;
}

export type RelationshipStatus = "good" | "attention" | "urgent";

// ============ 프로토타입용 타입 정의 ============

// 대화 입력 모드
export type ConversationInputMode = "sample" | "manual";

// 추출된 일정 (AI 분석 결과)
export interface ExtractedSchedule {
  id: string;
  type: "follow_up" | "check_event" | "send_gift" | "confirm_delivery" | "hospital" | "meeting";
  topic: string;
  dueDate: string; // YYYY-MM-DD
  reason: string;
  confidence: number; // 0-1 (AI가 추출한 확신도)
  selected: boolean; // 사용자가 선택했는지
}

// 대화 분석 결과
export interface ConversationAnalysis {
  conversationId: string;
  parentId: string;
  originalText: string;
  summary: string;
  keywords: string[];
  mood: "good" | "neutral" | "concerned";
  extractedSchedules: ExtractedSchedule[];
  createdAt: Date;
}

// 선택된 일정 (다음 통화 예정 목록에 추가될 항목)
export interface SelectedSchedule extends ExtractedSchedule {
  parentId: string;
  parentName: string;
  conversationId: string;
  selectedAt: Date;
}

// 프로토타입 스토어 상태
export interface PrototypeState {
  selectedSchedules: SelectedSchedule[];
  conversationHistories: ConversationAnalysis[];
  currentAnalysis: ConversationAnalysis | null;
}
