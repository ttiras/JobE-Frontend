-- JobE Database Schema
-- This script creates the necessary tables and relationships for the organizations feature

-- ============================================================================
-- ENUM TABLES (for dropdown options)
-- ============================================================================

-- Organization size enum
CREATE TABLE IF NOT EXISTS public.org_size (
  value TEXT PRIMARY KEY,
  comment TEXT
);

-- Insert default organization sizes
INSERT INTO public.org_size (value, comment) VALUES
  ('1-10', '1-10 employees'),
  ('11-50', '11-50 employees'),
  ('51-200', '51-200 employees'),
  ('201-500', '201-500 employees'),
  ('501-1000', '501-1000 employees'),
  ('1001-5000', '1001-5000 employees'),
  ('5001+', '5001+ employees')
ON CONFLICT (value) DO NOTHING;

-- Industries enum
CREATE TABLE IF NOT EXISTS public.industries_enum (
  value TEXT PRIMARY KEY,
  comment TEXT
);

-- Insert default industries
INSERT INTO public.industries_enum (value, comment) VALUES
  ('technology', 'Technology'),
  ('healthcare', 'Healthcare'),
  ('finance', 'Finance'),
  ('education', 'Education'),
  ('retail', 'Retail'),
  ('manufacturing', 'Manufacturing'),
  ('consulting', 'Consulting'),
  ('real_estate', 'Real Estate'),
  ('hospitality', 'Hospitality'),
  ('transportation', 'Transportation'),
  ('other', 'Other')
ON CONFLICT (value) DO NOTHING;

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT REFERENCES public.industries_enum(value),
  country TEXT,
  size TEXT REFERENCES public.org_size(value),
  is_active BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'USD',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL -- For soft deletes
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for finding user's organizations
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- Index for active organizations
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);

-- Index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON public.organizations(deleted_at) WHERE deleted_at IS NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_organizations_user_active ON public.organizations(created_by, is_active, deleted_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ============================================================================
-- PERMISSIONS (Hasura RLS)
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_size ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries_enum ENABLE ROW LEVEL SECURITY;

-- Users can only see their own organizations
CREATE POLICY "Users can view their own organizations"
  ON public.organizations
  FOR SELECT
  USING (auth.uid() = created_by);

-- Users can insert their own organizations
CREATE POLICY "Users can insert their own organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own organizations
CREATE POLICY "Users can update their own organizations"
  ON public.organizations
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can soft delete their own organizations
CREATE POLICY "Users can delete their own organizations"
  ON public.organizations
  FOR DELETE
  USING (auth.uid() = created_by);

-- Public can read enum tables
CREATE POLICY "Anyone can view org sizes"
  ON public.org_size
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view industries"
  ON public.industries_enum
  FOR SELECT
  USING (true);

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE public.organizations IS 'Stores organization information created by users';
COMMENT ON COLUMN public.organizations.deleted_at IS 'Soft delete timestamp - if set, the organization is considered deleted';
COMMENT ON TABLE public.org_size IS 'Enum table for organization sizes';
COMMENT ON TABLE public.industries_enum IS 'Enum table for industry types';
