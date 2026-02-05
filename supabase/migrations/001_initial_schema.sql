-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Parents table
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('mother', 'father', 'other')),
  birthday DATE,
  phone TEXT,
  profile_image_url TEXT,
  min_contact_interval_days INTEGER DEFAULT 14,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  mood TEXT CHECK (mood IN ('good', 'neutral', 'concerned')),
  parent_sentiment TEXT,
  summary TEXT,
  keywords TEXT[],
  interrupted BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  transcript TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Actions table
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow_up', 'check_event', 'send_gift', 'confirm_delivery')),
  topic TEXT NOT NULL,
  reason TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id),
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('action_due', 'call_incomplete', 'periodic', 'event_trigger')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  recording_enabled BOOLEAN DEFAULT TRUE,
  ai_analysis_enabled BOOLEAN DEFAULT TRUE,
  notification_time TIME DEFAULT '19:00:00',
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  notification_action_due BOOLEAN DEFAULT TRUE,
  notification_call_incomplete BOOLEAN DEFAULT TRUE,
  notification_periodic BOOLEAN DEFAULT TRUE,
  notification_event_trigger BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_parents_user_id ON parents(user_id);
CREATE INDEX idx_conversations_parent_id ON conversations(parent_id);
CREATE INDEX idx_actions_parent_id ON actions(parent_id);
CREATE INDEX idx_actions_due_date ON actions(due_date) WHERE completed = FALSE;
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE sent_at IS NULL;
