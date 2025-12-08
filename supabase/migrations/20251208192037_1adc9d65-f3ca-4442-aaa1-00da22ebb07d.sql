-- Drop all public access policies on trips table
DROP POLICY IF EXISTS "Allow public select on trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public insert on trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public update on trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public delete on trips" ON public.trips;

-- Create user-scoped RLS policies for trips table
-- Users can only view their own trips
CREATE POLICY "Users can view their own trips"
ON public.trips
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own trips
CREATE POLICY "Users can create their own trips"
ON public.trips
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own trips
CREATE POLICY "Users can update their own trips"
ON public.trips
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own trips
CREATE POLICY "Users can delete their own trips"
ON public.trips
FOR DELETE
USING (auth.uid() = user_id);