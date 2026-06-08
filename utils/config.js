export const CONFIG = {
  appName: "DraftMate",
  environment: "development",
  apiBaseUrl: "http://localhost:3000/api",
  trialDays: 30,
  plans: {
    free: {
      id: "free",
      label: "Free",
      monthlyUsd: 0,
      monthlyUgx: 0,
      dailyLimit: 5,
      model: "mistral-small-latest",
      features: ["5 AI requests per day", "Rewrite", "Grammar", "Summarize", "Auto-label preview"]
    },
    byo: {
      id: "byo",
      label: "BYO Key",
      monthlyUsd: 3,
      monthlyUgx: 11500,
      dailyLimit: Infinity,
      model: "User-provided OpenAI or Claude",
      features: ["Unlimited requests", "Local key storage", "Direct provider calls", "All writing tools"]
    },
    pro: {
      id: "pro",
      label: "Pro",
      monthlyUsd: 8,
      monthlyUgx: 30500,
      dailyLimit: Infinity,
      model: "Claude or GPT-4 class",
      features: ["Unlimited requests", "Premium AI", "One-month free trial", "Mobile money or card"]
    },
    business: {
      id: "business",
      label: "Business",
      monthlyUsd: 20,
      monthlyUgx: 76000,
      dailyLimit: Infinity,
      model: "Claude or GPT-4 class",
      features: ["Team-ready billing", "Unlimited requests", "Priority support", "One-month free trial"]
    }
  },
  providers: {
    free: "mistral",
    paid: "claude",
    fallbackPaid: "openai"
  },
  endpoints: {
    login: "/auth/login",
    signup: "/auth/signup",
    ai: "/ai",
    mobileMoney: "/payments/mobile-money",
    stripeCheckout: "/payments/stripe/checkout",
    stripePortal: "/payments/stripe/portal"
  },
  prompt: {
    maxCharacters: 8000,
    tones: ["formal", "business", "academic", "casual"]
  }
};

export function apiUrl(path) {
  return `${CONFIG.apiBaseUrl}${path}`;
}
