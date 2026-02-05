export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      parents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          relationship: "mother" | "father" | "other";
          birthday: string | null;
          phone: string | null;
          profile_image_url: string | null;
          min_contact_interval_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          relationship: "mother" | "father" | "other";
          birthday?: string | null;
          phone?: string | null;
          profile_image_url?: string | null;
          min_contact_interval_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          relationship?: "mother" | "father" | "other";
          birthday?: string | null;
          phone?: string | null;
          profile_image_url?: string | null;
          min_contact_interval_days?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          parent_id: string;
          started_at: string;
          ended_at: string | null;
          duration_minutes: number | null;
          mood: "good" | "neutral" | "concerned" | null;
          parent_sentiment: string | null;
          summary: string | null;
          keywords: string[] | null;
          interrupted: boolean;
          recording_url: string | null;
          transcript: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          started_at: string;
          ended_at?: string | null;
          duration_minutes?: number | null;
          mood?: "good" | "neutral" | "concerned" | null;
          parent_sentiment?: string | null;
          summary?: string | null;
          keywords?: string[] | null;
          interrupted?: boolean;
          recording_url?: string | null;
          transcript?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          started_at?: string;
          ended_at?: string | null;
          duration_minutes?: number | null;
          mood?: "good" | "neutral" | "concerned" | null;
          parent_sentiment?: string | null;
          summary?: string | null;
          keywords?: string[] | null;
          interrupted?: boolean;
          recording_url?: string | null;
          transcript?: string | null;
          created_at?: string;
        };
      };
      actions: {
        Row: {
          id: string;
          conversation_id: string | null;
          parent_id: string;
          type: "follow_up" | "check_event" | "send_gift" | "confirm_delivery";
          topic: string;
          reason: string | null;
          due_date: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id?: string | null;
          parent_id: string;
          type: "follow_up" | "check_event" | "send_gift" | "confirm_delivery";
          topic: string;
          reason?: string | null;
          due_date: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string | null;
          parent_id?: string;
          type?: "follow_up" | "check_event" | "send_gift" | "confirm_delivery";
          topic?: string;
          reason?: string | null;
          due_date?: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          parent_id: string | null;
          action_id: string | null;
          type: "action_due" | "call_incomplete" | "periodic" | "event_trigger";
          title: string;
          message: string;
          scheduled_for: string;
          sent_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          parent_id?: string | null;
          action_id?: string | null;
          type: "action_due" | "call_incomplete" | "periodic" | "event_trigger";
          title: string;
          message: string;
          scheduled_for: string;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          parent_id?: string | null;
          action_id?: string | null;
          type?: "action_due" | "call_incomplete" | "periodic" | "event_trigger";
          title?: string;
          message?: string;
          scheduled_for?: string;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          recording_enabled: boolean;
          ai_analysis_enabled: boolean;
          notification_time: string;
          do_not_disturb_start: string | null;
          do_not_disturb_end: string | null;
          notification_action_due: boolean;
          notification_call_incomplete: boolean;
          notification_periodic: boolean;
          notification_event_trigger: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          recording_enabled?: boolean;
          ai_analysis_enabled?: boolean;
          notification_time?: string;
          do_not_disturb_start?: string | null;
          do_not_disturb_end?: string | null;
          notification_action_due?: boolean;
          notification_call_incomplete?: boolean;
          notification_periodic?: boolean;
          notification_event_trigger?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          recording_enabled?: boolean;
          ai_analysis_enabled?: boolean;
          notification_time?: string;
          do_not_disturb_start?: string | null;
          do_not_disturb_end?: string | null;
          notification_action_due?: boolean;
          notification_call_incomplete?: boolean;
          notification_periodic?: boolean;
          notification_event_trigger?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
