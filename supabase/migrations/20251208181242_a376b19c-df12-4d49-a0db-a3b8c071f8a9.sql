-- Remove the foreign key constraint on trips.user_id to allow guest users
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_user_id_fkey;

-- Also update profiles RLS to allow public access for the demo
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Allow public access on profiles" 
ON public.profiles 
FOR ALL 
USING (true)
WITH CHECK (true);