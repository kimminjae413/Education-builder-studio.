-- Cloud SQL 스키마 마이그레이션 스크립트
-- Supabase → Google Cloud SQL (PostgreSQL)

-- ===========================================
-- 1. 프로필 테이블 수정
-- UUID → VARCHAR(128) (Firebase UID)
-- ===========================================

ALTER TABLE profiles
  ALTER COLUMN id TYPE VARCHAR(128);

-- ===========================================
-- 2. 교육 자료 테이블 수정
-- embedding 컬럼 제거 (Gemini File Search API로 대체)
-- gcs_path 컬럼 추가
-- indexed 컬럼 추가
-- ===========================================

-- embedding 컬럼 제거
ALTER TABLE teaching_materials
  DROP COLUMN IF EXISTS embedding;

-- gcs_path 컬럼 추가
ALTER TABLE teaching_materials
  ADD COLUMN IF NOT EXISTS gcs_path TEXT;

-- indexed 컬럼 추가 (Gemini File Search 인덱싱 여부)
ALTER TABLE teaching_materials
  ADD COLUMN IF NOT EXISTS indexed BOOLEAN DEFAULT FALSE;

-- user_id 타입 변경
ALTER TABLE teaching_materials
  ALTER COLUMN user_id TYPE VARCHAR(128);

-- ===========================================
-- 3. 과정 테이블 수정
-- user_id 타입 변경
-- ===========================================

ALTER TABLE courses
  ALTER COLUMN user_id TYPE VARCHAR(128);

-- ===========================================
-- 4. 인덱스 생성 (성능 최적화)
-- ===========================================

-- 시드 데이터 필터링용
CREATE INDEX IF NOT EXISTS idx_materials_seed_approved
  ON teaching_materials (is_seed_data, status)
  WHERE is_seed_data = TRUE AND status = 'approved';

-- Gemini File Search 인덱싱 대기 목록용
CREATE INDEX IF NOT EXISTS idx_materials_indexing_pending
  ON teaching_materials (indexed)
  WHERE indexed = FALSE AND is_seed_data = TRUE AND status = 'approved';

-- 사용자별 자료 조회용
CREATE INDEX IF NOT EXISTS idx_materials_user
  ON teaching_materials (user_id);

-- 과정 사용자 조회용
CREATE INDEX IF NOT EXISTS idx_courses_user
  ON courses (user_id);

-- ===========================================
-- 5. 기존 벡터 검색 함수 제거 (선택사항)
-- ===========================================

-- DROP FUNCTION IF EXISTS match_materials(vector, float, int);
-- DROP FUNCTION IF EXISTS match_materials_by_embedding(vector, float, int);

-- ===========================================
-- 6. pgvector 확장 제거 (선택사항)
-- Cloud SQL에서는 pgvector가 필요 없음
-- ===========================================

-- DROP EXTENSION IF EXISTS vector;

-- ===========================================
-- 완료 메시지
-- ===========================================

SELECT 'Schema migration completed successfully!' AS status;
