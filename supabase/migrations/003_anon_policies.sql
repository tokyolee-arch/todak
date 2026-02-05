-- 개발/로컬 테스트용: anon 키로 앱이 테이블에 접근할 수 있도록 정책 추가
-- (나중에 Supabase Auth 연동 시 auth.uid() 기준으로 제한하는 정책으로 교체하세요)
-- 재실행 가능하도록 기존 정책이 있으면 제거 후 생성합니다.

-- 1) 기존 정책 제거 (이미 있으면 무시)
DROP POLICY IF EXISTS "anon_all_users" ON users;
DROP POLICY IF EXISTS "anon_all_parents" ON parents;
DROP POLICY IF EXISTS "anon_all_conversations" ON conversations;
DROP POLICY IF EXISTS "anon_all_actions" ON actions;
DROP POLICY IF EXISTS "anon_all_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_all_user_settings" ON user_settings;

-- 2) RLS 활성화 (이미 켜져 있어도 에러 없음)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 3) anon 전체 허용 정책 생성
CREATE POLICY "anon_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_parents" ON parents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_actions" ON actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);
