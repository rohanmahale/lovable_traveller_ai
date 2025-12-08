-- Drop existing RLS policies on trips table
DROP POLICY IF EXISTS "Users can create own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;

-- Create new policies that allow public access for demo/guest usage
CREATE POLICY "Allow public insert on trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on trips" 
ON public.trips 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update on trips" 
ON public.trips 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on trips" 
ON public.trips 
FOR DELETE 
USING (true);