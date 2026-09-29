-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  university TEXT,
  study_program TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  assignment_type TEXT NOT NULL,
  question TEXT NOT NULL,
  instructions TEXT,
  writing_style TEXT NOT NULL DEFAULT 'Akademik',
  length TEXT NOT NULL DEFAULT 'Sedang',
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  authors TEXT,
  year INTEGER,
  journal TEXT,
  doi TEXT,
  url TEXT,
  abstract TEXT,
  source TEXT DEFAULT 'OpenAlex',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REVISIONS TABLE
CREATE TABLE IF NOT EXISTS public.revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  old_content TEXT NOT NULL,
  new_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ANALYSES TABLE
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  ai_score NUMERIC,
  human_score NUMERIC,
  analysis_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- ROW LEVEL SECURITY POLICIES

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Assignments
CREATE POLICY "Users can view their own assignments" ON public.assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assignments" ON public.assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" ON public.assignments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments" ON public.assignments
  FOR DELETE USING (auth.uid() = user_id);

-- References
CREATE POLICY "Users can view references for their assignments" ON public.references
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE public.assignments.id = public.references.assignment_id
      AND public.assignments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert references for their assignments" ON public.references
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE public.assignments.id = public.references.assignment_id
      AND public.assignments.user_id = auth.uid()
    )
  );

-- Revisions
CREATE POLICY "Users can view revisions for their assignments" ON public.revisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE public.assignments.id = public.revisions.assignment_id
      AND public.assignments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert revisions for their assignments" ON public.revisions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE public.assignments.id = public.revisions.assignment_id
      AND public.assignments.user_id = auth.uid()
    )
  );

-- Analyses
CREATE POLICY "Users can view their own analyses" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON public.analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AUTOMATIC PROFILE TRIGGER ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, university, study_program, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'university',
    NEW.raw_user_meta_data->>'study_program',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
