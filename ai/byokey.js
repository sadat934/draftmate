import { getByoKey } from "../utils/storage.js";

export async function requestByoModel(payload) {
  const byo = getByoKey();
  if (!byo?.apiKey) {
    throw new Error("Add your BYO API key before using the BYO plan.");
  }

  if (byo.provider === "anthropic") {
    return callAnthropic(payload, byo.apiKey);
  }

  if (byo.provider === "mistral") {
    return callMistral(payload, byo.apiKey);
  }

  if (byo.provider === "openrouter") {
    return callOpenRouter(payload, byo.apiKey);
  }

  if (byo.provider === "gemini") {
    return callGemini(payload, byo.apiKey);
  }

  if (byo.provider === "custom") {
    return callCustom(payload, byo);
  }

  return callOpenAi(payload, byo.apiKey, byo.model);
}

async function callOpenAi(payload, apiKey, customModel = "") {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: customModel || "gpt-4o-mini",
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

async function callMistral(payload, apiKey) {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
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
    provider: "Mistral BYO",
    text: data.choices?.[0]?.message?.content?.trim() || ""
  };
}

async function callOpenRouter(payload, apiKey) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://sadat934.github.io/draftmate/",
      "X-Title": "DraftMate"
    },
    body: JSON.stringify({
      model: "anthropic/claude-3.5-haiku",
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
    provider: "OpenRouter BYO",
    text: data.choices?.[0]?.message?.content?.trim() || ""
  };
}

async function callGemini(payload, apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are DraftMate, a concise Microsoft Word writing assistant.\n\n${payload.prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return {
    provider: "Gemini BYO",
    text: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
  };
}

async function callCustom(payload, byo) {
  const endpoint = byo.endpoint || "https://api.openai.com/v1/chat/completions";
  const model = byo.model || "gpt-4o-mini";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${byo.apiKey}`
    },
    body: JSON.stringify({
      model: model,
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
    provider: `Custom (${model})`,
    text: data.choices?.[0]?.message?.content?.trim() || ""
  };
}
