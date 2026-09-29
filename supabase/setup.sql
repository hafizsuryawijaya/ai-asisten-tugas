-- ==========================================================
-- SUPABASE DATABASE SETUP SCRIPT FOR AI ASISTEN TUGAS MAHASISWA
-- Execute this script in Supabase Dashboard -> SQL Editor
-- ==========================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  university TEXT,
  study_program TEXT,
  student_id TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  assignment_type TEXT NOT NULL,
  question TEXT NOT NULL,
  instructions TEXT,
  writing_style TEXT,
  length TEXT,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. REFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id TEXT REFERENCES public.assignments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  authors TEXT,
  year INT,
  journal TEXT,
  doi TEXT,
  url TEXT,
  abstract TEXT,
  source TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. REVISIONS TABLE
CREATE TABLE IF NOT EXISTS public.revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id TEXT REFERENCES public.assignments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  old_content TEXT,
  new_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ANALYSES TABLE
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES FOR FAST QUERIES
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_references_assignment_id ON public.references(assignment_id);
CREATE INDEX IF NOT EXISTS idx_revisions_assignment_id ON public.revisions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);

-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- RLS POLICIES FOR PROFILES
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------
-- RLS POLICIES FOR ASSIGNMENTS
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own assignments" ON public.assignments;
CREATE POLICY "Users can view own assignments"
  ON public.assignments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assignments" ON public.assignments;
CREATE POLICY "Users can insert own assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own assignments" ON public.assignments;
CREATE POLICY "Users can update own assignments"
  ON public.assignments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own assignments" ON public.assignments;
CREATE POLICY "Users can delete own assignments"
  ON public.assignments FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------
-- RLS POLICIES FOR REFERENCES
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view references of own assignments" ON public.references;
CREATE POLICY "Users can view references of own assignments"
  ON public.references FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE public.assignments.id = public.references.assignment_id
        AND public.assignments.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert references to own assignments" ON public.references;
CREATE POLICY "Users can insert references to own assignments"
  ON public.references FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE public.assignments.id = public.references.assignment_id
        AND public.assignments.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------
-- RLS POLICIES FOR REVISIONS
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view revisions of own assignments" ON public.revisions;
CREATE POLICY "Users can view revisions of own assignments"
  ON public.revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE public.assignments.id = public.revisions.assignment_id
        AND public.assignments.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert revisions to own assignments" ON public.revisions;
CREATE POLICY "Users can insert revisions to own assignments"
  ON public.revisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE public.assignments.id = public.revisions.assignment_id
        AND public.assignments.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------
-- RLS POLICIES FOR ANALYSES
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own analyses" ON public.analyses;
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON public.analyses;
CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, university, study_program, student_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'university', ''),
    COALESCE(new.raw_user_meta_data->>'study_program', ''),
    COALESCE(new.raw_user_meta_data->>'student_id', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    university = EXCLUDED.university,
    study_program = EXCLUDED.study_program,
    student_id = EXCLUDED.student_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
