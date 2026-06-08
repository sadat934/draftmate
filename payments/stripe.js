import { apiUrl, CONFIG } from "../utils/config.js";
import { getSession } from "../utils/storage.js";

export async function startStripeCheckout(plan) {
  const response = await fetch(apiUrl(CONFIG.endpoints.stripeCheckout), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getSession()?.token || "guest"}`
    },
    body: JSON.stringify({ plan })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  window.location.href = data.url;
}
