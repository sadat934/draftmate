import { CONFIG } from "./config.js";
import { getPlan, getUsageState, setUsageState } from "./storage.js";

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function limitForPlan(plan = getPlan()) {
  return CONFIG.plans[plan]?.dailyLimit ?? CONFIG.plans.free.dailyLimit;
}

export function getUsage(plan = getPlan()) {
  const key = todayKey();
  const state = getUsageState();
  const count = state[key] || 0;
  const limit = limitForPlan(plan);
  return {
    date: key,
    count,
    limit,
    remaining: limit === Infinity ? Infinity : Math.max(0, limit - count),
    allowed: limit === Infinity || count < limit
  };
}

export function incrementUsage(plan = getPlan()) {
  const usage = getUsage(plan);
  if (!usage.allowed) {
    return usage;
  }

  if (usage.limit === Infinity) {
    return usage;
  }

  const state = getUsageState();
  state[usage.date] = usage.count + 1;
  setUsageState(state);
  return getUsage(plan);
}

export function trialEndsAt(startIso) {
  const start = startIso ? new Date(startIso) : new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + CONFIG.trialDays);
  return end.toISOString();
}

export function isTrialActive(session) {
  if (!session?.trialEndsAt) return false;
  return new Date(session.trialEndsAt).getTime() > Date.now();
}
