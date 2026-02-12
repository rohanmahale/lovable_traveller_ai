
-- Drop old permissive policies on trips
DROP POLICY IF EXISTS "Allow public delete on trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public insert on trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public select on trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public update on trips" ON public.trips;

-- Create user-specific policies on trips
CREATE POLICY "Users can view their own trips"
ON public.trips FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips"
ON public.trips FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
ON public.trips FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
ON public.trips FOR DELETE
USING (auth.uid() = user_id);

-- Drop old permissive policies on bookings
DROP POLICY IF EXISTS "Allow public delete on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public insert on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public select on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public update on bookings" ON public.bookings;

-- Create user-specific policies on bookings (via trip ownership)
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = bookings.trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Users can create their own bookings"
ON public.bookings FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = bookings.trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Users can update their own bookings"
ON public.bookings FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = bookings.trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Users can delete their own bookings"
ON public.bookings FOR DELETE
USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = bookings.trip_id AND trips.user_id = auth.uid()));
