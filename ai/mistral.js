import { apiUrl, CONFIG } from "../utils/config.js";
import { getSession } from "../utils/storage.js";

export async function requestFreeModel(payload) {
  const response = await fetch(apiUrl(CONFIG.endpoints.ai), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getSession()?.token || "guest"}`
    },
    body: JSON.stringify({
      ...payload,
      provider: "mistral",
      plan: "free"
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
