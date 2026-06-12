import { getPlan, getSession, getByoKey } from "../utils/storage.js";
import { isTrialActive } from "../utils/tracker.js";
import { requestFreeModel } from "./mistral.js";
import { requestByoModel } from "./byokey.js";
import { requestPaidModel } from "./claude.js";

export async function runAiTask(payload) {
  const session = getSession();
  const byo = getByoKey();
  
  // If BYO key exists, use it regardless of plan
  if (byo?.apiKey) {
    return requestByoModel(payload);
  }

  const plan = getPlan();
  const effectivePlan = isTrialActive(session) && plan === "free" ? "pro" : plan;

  if (effectivePlan === "pro" || effectivePlan === "business") {
    return requestPaidModel({ ...payload, plan: effectivePlan });
  }

  return requestFreeModel(payload);
}

export function buildPrompt({ action, instruction, tone, sourceText }) {
  const base = {
    rewrite: "Rewrite the text clearly while preserving the original meaning.",
    grammar: "Correct grammar, spelling, punctuation, and clarity without changing the meaning.",
    summarize: "Summarize the text into concise bullet points and include an executive summary when useful.",
    headings: "Suggest Word heading titles for the document. Return JSON only: [{\"paragraphIndex\":0,\"level\":1,\"title\":\"...\"}]."
  }[action] || "Improve the writing.";

  return [
    base,
    `Tone: ${tone || "business"}.`,
    instruction ? `User instruction: ${instruction}` : "",
    "Source text:",
    sourceText || "(No text was provided.)"
  ].filter(Boolean).join("\n\n");
}
