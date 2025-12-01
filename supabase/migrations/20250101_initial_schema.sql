-- ====================================
-- 1. UUID 확장 활성화
-- ====================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 2. Profiles 테이블 (랭크 시스템 포함)
-- ====================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  
  -- 역할 (회원가입 시 자동으로 instructor)
  role TEXT DEFAULT 'instructor' CHECK (role IN ('admin', 'instructor')),
  
  -- 랭크 시스템
  rank TEXT DEFAULT 'newcomer' CHECK (rank IN (
    'newcomer', 'junior', 'intermediate', 'senior', 'veteran', 'master'
  )),
  rank_points INTEGER DEFAULT 0,
  rank_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- 수동 조정 (관리자만)
  manual_rank_override BOOLEAN DEFAULT FALSE,
  manual_rank_reason TEXT,
  promoted_to_master_at TIMESTAMP WITH TIME ZONE,
  
  -- 프로필
  avatar_url TEXT,
  bio TEXT,
  
  -- 제한 확인용
  ai_usage_count_this_month INTEGER DEFAULT 0,
  content_upload_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_profiles_rank ON public.profiles(rank);
CREATE INDEX idx_profiles_rank_points ON public.profiles(rank_points DESC);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- RLS 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view basic profile"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ====================================
-- 3. Teaching Materials 테이블
-- ====================================
CREATE TABLE public.teaching_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- 파일 정보
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  
  -- 메타데이터
  title TEXT NOT NULL,
  description TEXT,
  content_text TEXT,
  thumbnail_url TEXT,
  
  -- 카테고리
  target_category TEXT,
  subject_category TEXT,
  tool_categories TEXT[],
  method_categories TEXT[],
  
  duration INTEGER,
  difficulty TEXT CHECK (difficulty IN ('low', 'medium', 'high')),
  learning_objectives TEXT,
  
  -- 통계 (랭크 포인트 계산에 사용)
  usage_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- 기여도
  contribution_score INTEGER DEFAULT 0,
  
  -- 승인 시스템
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_note TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_materials_user ON public.teaching_materials(user_id);
CREATE INDEX idx_materials_status ON public.teaching_materials(status);
CREATE INDEX idx_materials_contribution ON public.teaching_materials(contribution_score DESC);

-- RLS 정책
ALTER TABLE public.teaching_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved materials"
  ON public.teaching_materials FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid());

CREATE POLICY "Users can CRUD own materials"
  ON public.teaching_materials FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view/update all materials"
  ON public.teaching_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ====================================
-- 4. Bookmarks 테이블
-- ====================================
CREATE TABLE public.bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.teaching_materials(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, material_id)
);

CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_material ON public.bookmarks(material_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- 북마크 추가 시 카운트 증가
CREATE OR REPLACE FUNCTION increment_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.teaching_materials
  SET bookmark_count = bookmark_count + 1
  WHERE id = NEW.material_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_bookmark
AFTER INSERT ON public.bookmarks
FOR EACH ROW
EXECUTE FUNCTION increment_bookmark_count();

-- 북마크 삭제 시 카운트 감소
CREATE OR REPLACE FUNCTION decrement_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.teaching_materials
  SET bookmark_count = bookmark_count - 1
  WHERE id = OLD.material_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_bookmark
AFTER DELETE ON public.bookmarks
FOR EACH ROW
EXECUTE FUNCTION decrement_bookmark_count();

-- ====================================
-- 5. 자동 프로필 생성 트리거
-- ====================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'instructor')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================
-- 6. Updated_at 자동 업데이트
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.teaching_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
