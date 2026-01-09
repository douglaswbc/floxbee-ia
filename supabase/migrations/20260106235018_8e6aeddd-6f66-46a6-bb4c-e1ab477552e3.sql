-- Add matricula field to profiles (required for admin users)
-- Add must_change_password flag for first login flow
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS matricula text,
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- Create index for matricula lookups
CREATE INDEX IF NOT EXISTS idx_profiles_matricula ON public.profiles(matricula);