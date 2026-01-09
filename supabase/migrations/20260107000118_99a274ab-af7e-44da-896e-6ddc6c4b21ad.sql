-- Create function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$$;

-- Update RLS policy for user_roles to allow superadmin to manage all roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins and superadmins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Update profiles policy to allow superadmin full access
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users and superadmins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Allow superadmin to delete profiles
CREATE POLICY "Superadmins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));