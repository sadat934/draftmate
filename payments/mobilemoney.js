import { apiUrl, CONFIG } from "../utils/config.js";
import { getSession } from "../utils/storage.js";

export async function startMobileMoneyCheckout({ phoneNumber, plan, currencyCode }) {
  if (!phoneNumber) {
    throw new Error("Enter the mobile money phone number.");
  }

  const response = await fetch(apiUrl(CONFIG.endpoints.mobileMoney), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getSession()?.token || "guest"}`
    },
    body: JSON.stringify({ phoneNumber, plan, currencyCode })
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
