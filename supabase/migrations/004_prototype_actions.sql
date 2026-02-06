-- 004_prototype_actions.sql
-- 프로토타입용 actions 테이블 수정

-- confidence 컬럼 추가 (AI 추출 확신도, 0-1)
ALTER TABLE actions ADD COLUMN IF NOT EXISTS confidence FLOAT;

-- selected 컬럼 추가 (사용자 선택 여부)
ALTER TABLE actions ADD COLUMN IF NOT EXISTS selected BOOLEAN DEFAULT FALSE;

-- type 컬럼에 새로운 값 허용을 위해 제약 조건 수정
-- 기존 타입: 'follow_up', 'check_event', 'send_gift', 'confirm_delivery'
-- 추가 타입: 'hospital', 'meeting'

-- 기존 제약 조건 삭제 (있는 경우)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'actions_type_check' 
    AND table_name = 'actions'
  ) THEN
    ALTER TABLE actions DROP CONSTRAINT actions_type_check;
  END IF;
END $$;

-- 새로운 제약 조건 추가
ALTER TABLE actions ADD CONSTRAINT actions_type_check 
  CHECK (type IN ('follow_up', 'check_event', 'send_gift', 'confirm_delivery', 'hospital', 'meeting'));

-- 인덱스 추가 (선택된 일정 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_actions_selected ON actions(selected) WHERE selected = TRUE;

-- 코멘트 추가
COMMENT ON COLUMN actions.confidence IS 'AI가 추출한 일정의 확신도 (0-1)';
COMMENT ON COLUMN actions.selected IS '사용자가 다음 통화 예정 목록에 추가했는지 여부';
