-- ====================================
-- 관리자 전용 함수
-- ====================================

-- 1. 관리자 권한 확인 함수
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- 2. 수동 랭크 조정 (관리자만)
CREATE OR REPLACE FUNCTION admin_adjust_rank(
  admin_uuid UUID,
  target_user_uuid UUID,
  new_rank TEXT,
  reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 관리자 권한 확인
  IF NOT is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can adjust ranks';
  END IF;
  
  -- 랭크 업데이트
  UPDATE public.profiles
  SET
    rank = new_rank,
    manual_rank_override = TRUE,
    manual_rank_reason = reason,
    rank_updated_at = NOW()
  WHERE id = target_user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. MASTER 승급 (관리자만)
CREATE OR REPLACE FUNCTION admin_promote_to_master(
  admin_uuid UUID,
  target_user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 관리자 권한 확인
  IF NOT is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can promote to MASTER';
  END IF;
  
  -- 포인트 확인 (10000점 이상이어야 함)
  IF (SELECT rank_points FROM public.profiles WHERE id = target_user_uuid) < 10000 THEN
    RAISE EXCEPTION 'User must have at least 10000 points to be promoted to MASTER';
  END IF;
  
  UPDATE public.profiles
  SET
    rank = 'master',
    promoted_to_master_at = NOW(),
    rank_updated_at = NOW()
  WHERE id = target_user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 콘텐츠 승인/거부 (관리자만)
CREATE OR REPLACE FUNCTION admin_review_content(
  admin_uuid UUID,
  material_uuid UUID,
  new_status TEXT,
  note TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 관리자 권한 확인
  IF NOT is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can review content';
  END IF;
  
  -- 상태 확인
  IF new_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: must be approved or rejected';
  END IF;
  
  UPDATE public.teaching_materials
  SET
    status = new_status,
    reviewed_by = admin_uuid,
    reviewed_at = NOW(),
    review_note = note
  WHERE id = material_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 전체 통계 뷰 (관리자용)
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'instructor') as total_instructors,
  (SELECT COUNT(*) FROM public.profiles WHERE rank = 'newcomer') as newcomer_count,
  (SELECT COUNT(*) FROM public.profiles WHERE rank = 'junior') as junior_count,
  (SELECT COUNT(*) FROM public.profiles WHERE rank = 'intermediate') as intermediate_count,
  (SELECT COUNT(*) FROM public.profiles WHERE rank = 'senior') as senior_count,
  (SELECT COUNT(*) FROM public.profiles WHERE rank = 'veteran') as veteran_count,
  (SELECT COUNT(*) FROM public.profiles WHERE rank = 'master') as master_count,
  (SELECT COUNT(*) FROM public.teaching_materials) as total_materials,
  (SELECT COUNT(*) FROM public.teaching_materials WHERE status = 'pending') as pending_materials,
  (SELECT COUNT(*) FROM public.teaching_materials WHERE status = 'approved') as approved_materials,
  (SELECT COUNT(*) FROM public.teaching_materials WHERE status = 'rejected') as rejected_materials,
  (SELECT COALESCE(SUM(usage_count), 0) FROM public.teaching_materials) as total_usage,
  (SELECT COALESCE(SUM(download_count), 0) FROM public.teaching_materials) as total_downloads;

-- RLS for admin_stats (관리자만 조회 가능)
ALTER VIEW admin_stats SET (security_invoker = on);

-- 6. 사용자 상세 정보 조회 (관리자용)
CREATE OR REPLACE FUNCTION admin_get_user_details(
  admin_uuid UUID,
  target_user_uuid UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- 관리자 권한 확인
  IF NOT is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view user details';
  END IF;
  
  SELECT json_build_object(
    'profile', (SELECT row_to_json(p.*) FROM public.profiles p WHERE id = target_user_uuid),
    'materials_count', (SELECT COUNT(*) FROM public.teaching_materials WHERE user_id = target_user_uuid),
    'approved_materials', (SELECT COUNT(*) FROM public.teaching_materials WHERE user_id = target_user_uuid AND status = 'approved'),
    'total_usage', (SELECT COALESCE(SUM(usage_count), 0) FROM public.teaching_materials WHERE user_id = target_user_uuid),
    'total_downloads', (SELECT COALESCE(SUM(download_count), 0) FROM public.teaching_materials WHERE user_id = target_user_uuid)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
