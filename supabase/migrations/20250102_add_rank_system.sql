-- ====================================
-- 랭크 자동 계산 시스템
-- ====================================

-- 1. 사용자 랭크 포인트 계산 함수
CREATE OR REPLACE FUNCTION calculate_user_rank_points(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(
      (usage_count * 10) +
      (download_count * 20) +
      (bookmark_count * 15) +
      ((rating * rating_count * 50)::INTEGER)
    ), 0)
  INTO total_points
  FROM public.teaching_materials
  WHERE user_id = user_uuid AND status = 'approved';
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- 2. 랭크 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_rank(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  points INTEGER;
  new_rank TEXT;
  current_rank TEXT;
  manual_override BOOLEAN;
BEGIN
  -- 현재 정보 가져오기
  SELECT rank, manual_rank_override
  INTO current_rank, manual_override
  FROM public.profiles
  WHERE id = user_uuid;
  
  -- 수동 조정된 경우 건너뛰기
  IF manual_override THEN
    RETURN current_rank;
  END IF;
  
  -- 포인트 계산
  points := calculate_user_rank_points(user_uuid);
  
  -- 랭크 결정 (MASTER는 관리자 승인 필요)
  IF points >= 10000 THEN
    new_rank := 'veteran';
  ELSIF points >= 5000 THEN
    new_rank := 'veteran';
  ELSIF points >= 2000 THEN
    new_rank := 'senior';
  ELSIF points >= 500 THEN
    new_rank := 'intermediate';
  ELSIF points >= 100 THEN
    new_rank := 'junior';
  ELSE
    new_rank := 'newcomer';
  END IF;
  
  -- 업데이트
  UPDATE public.profiles
  SET
    rank = new_rank,
    rank_points = points,
    rank_updated_at = NOW()
  WHERE id = user_uuid;
  
  RETURN new_rank;
END;
$$ LANGUAGE plpgsql;

-- 3. 콘텐츠 통계 업데이트 시 자동으로 랭크 재계산
CREATE OR REPLACE FUNCTION trigger_update_rank()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_rank(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_material_stats_update_rank
AFTER UPDATE OF usage_count, download_count, bookmark_count, rating, rating_count
ON public.teaching_materials
FOR EACH ROW
EXECUTE FUNCTION trigger_update_rank();

-- 4. 콘텐츠 승인 시 랭크 업데이트
CREATE OR REPLACE FUNCTION trigger_update_rank_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    PERFORM update_user_rank(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_material_approval_update_rank
AFTER UPDATE OF status
ON public.teaching_materials
FOR EACH ROW
EXECUTE FUNCTION trigger_update_rank_on_approval();
