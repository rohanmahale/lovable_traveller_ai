import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// Note: You'll need to set this as an environment variable
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

export const stripePromise = STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;
