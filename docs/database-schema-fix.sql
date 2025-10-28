-- Fix the RLS policies - Nhost uses Hasura permissions instead of PostgreSQL RLS
-- This script removes the RLS policies and disables RLS (Hasura handles authorization)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can insert their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can delete their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can view org sizes" ON public.org_size;
DROP POLICY IF EXISTS "Anyone can view industries" ON public.industries_enum;

-- Disable Row Level Security (not needed with Hasura)
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_size DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries_enum DISABLE ROW LEVEL SECURITY;

-- Grant permissions to hasura role
GRANT ALL ON public.organizations TO nhost_hasura;
GRANT ALL ON public.org_size TO nhost_hasura;
GRANT ALL ON public.industries_enum TO nhost_hasura;
