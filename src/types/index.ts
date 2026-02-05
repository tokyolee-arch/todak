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
  type: "follow_up" | "check_event" | "send_gift" | "confirm_delivery";
  topic: string;
  reason?: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
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
