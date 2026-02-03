-- vertex_indexed → indexed 컬럼명 변경 마이그레이션
-- 실행: Cloud SQL 콘솔에서 직접 실행

-- 1. 컬럼명 변경
ALTER TABLE teaching_materials
  RENAME COLUMN vertex_indexed TO indexed;

-- 2. 기존 인덱스 삭제 (있으면)
DROP INDEX IF EXISTS idx_materials_vertex_pending;

-- 3. 새 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_materials_indexing_pending
  ON teaching_materials (indexed)
  WHERE indexed = FALSE AND is_seed_data = TRUE AND status = 'approved';

-- 확인
SELECT column_name FROM information_schema.columns
WHERE table_name = 'teaching_materials' AND column_name = 'indexed';
