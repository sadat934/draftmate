import { getByoKey } from "../utils/storage.js";

export async function requestByoModel(payload) {
  const byo = getByoKey();
  if (!byo?.apiKey) {
    throw new Error("Add your BYO API key before using the BYO plan.");
  }

  if (byo.provider === "anthropic") {
    return callAnthropic(payload, byo.apiKey);
  }

  return callOpenAi(payload, byo.apiKey);
}

async function callOpenAi(payload, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are DraftMate, a concise Microsoft Word writing assistant." },
        { role: "user", content: payload.prompt }
      ],
      temperature: 0.4
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return {
    provider: "OpenAI BYO",
    text: data.choices?.[0]?.message?.content?.trim() || ""
  };
}

async function callAnthropic(payload, apiKey) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1800,
      temperature: 0.4,
      messages: [{ role: "user", content: payload.prompt }]
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return {
    provider: "Claude BYO",
    text: data.content?.map((part) => part.text || "").join("").trim() || ""
  };
}
