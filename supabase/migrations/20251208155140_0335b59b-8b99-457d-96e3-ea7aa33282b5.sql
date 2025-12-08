-- Drop existing RLS policies on bookings table
DROP POLICY IF EXISTS "Users can create bookings for own trips" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;

-- Create new policies that allow public access for demo/guest usage
CREATE POLICY "Allow public insert on bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on bookings" 
ON public.bookings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update on bookings" 
ON public.bookings 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on bookings" 
ON public.bookings 
FOR DELETE 
USING (true);