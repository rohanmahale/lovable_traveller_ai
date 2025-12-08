-- Drop existing restrictive RLS policies on trips
DROP POLICY IF EXISTS "Users can create their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can view their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON public.trips;

-- Create public policies for trips to allow guest/demo access
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