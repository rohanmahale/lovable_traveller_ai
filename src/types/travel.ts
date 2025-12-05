export interface Trip {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number | null;
  travelers: number;
  itinerary_json: Itinerary | null;
  status: 'draft' | 'planned' | 'booked' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Itinerary {
  destination: string;
  summary: string;
  estimatedBudget: {
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
    total: number;
  };
  tips: string[];
  days: ItineraryDay[];
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
  meals: Meal[];
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  estimatedCost: number;
  tips?: string;
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner';
  restaurant: string;
  cuisine: string;
  priceRange: string;
  recommendation: string;
}

export interface Flight {
  id: string;
  price: {
    total: number;
    currency: string;
  };
  outbound: FlightSegment;
  return: FlightSegment | null;
  cabinClass: string;
  bookingClass?: string;
  seatsAvailable?: number;
}

export interface FlightSegment {
  departure: {
    airport: string;
    time: string;
  };
  arrival: {
    airport: string;
    time: string;
  };
  duration: string;
  stops: number;
  carrier: string;
  flightNumber: string;
}

export interface Booking {
  id: string;
  trip_id: string;
  provider_name: string;
  amount_cents: number;
  currency: string;
  flight_data_json: Flight | null;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripFormData {
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  budget: string;
  travelers: string;
  interests: string;
}
