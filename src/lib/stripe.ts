import Stripe from "stripe";

// Lazy Stripe instance - only initializes when actually needed
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// For backward compatibility - deprecated, use getStripe() instead
export const stripe = {
  checkout: {
    sessions: {
      create: async (...args: Parameters<Stripe["checkout"]["sessions"]["create"]>) =>
        getStripe().checkout.sessions.create(...args),
    },
  },
};

// Price IDs for each plan (you'll create these in Stripe Dashboard)
export const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "price_pro_yearly",
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || "price_premium_monthly",
    yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || "price_premium_yearly",
  },
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "price_starter_monthly",
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || "price_starter_yearly",
  },
  business: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "price_business_monthly",
    yearly: process.env.STRICE_BUSINESS_YEARLY_PRICE_ID || "price_business_yearly",
  },
};

// Plan details for checkout session
export const PLAN_DETAILS: Record<string, {
  name: string;
  description: string;
  prices: { monthly: number; yearly: number };
}> = {
  pro: {
    name: "Pro Plan",
    description: "Unlimited applications, saved jobs, profile boost & analytics",
    prices: { monthly: 999, yearly: 699 },
  },
  premium: {
    name: "Premium Plan",
    description: "AI resume review, skill gap analysis, salary insights & career coaching",
    prices: { monthly: 1999, yearly: 1499 },
  },
  starter: {
    name: "Starter Plan",
    description: "Post up to 3 jobs, 50 applicant views, basic analytics",
    prices: { monthly: 4900, yearly: 3900 },
  },
  business: {
    name: "Business Plan",
    description: "Post up to 10 jobs, AI candidate matching, featured listings",
    prices: { monthly: 14900, yearly: 11900 },
  },
};
