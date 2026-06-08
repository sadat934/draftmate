import { CONFIG } from "../utils/config.js";
import { startMobileMoneyCheckout } from "./mobilemoney.js";
import { startStripeCheckout } from "./stripe.js";

const mount = document.querySelector("#plansMount");
const plans = Object.values(CONFIG.plans);

mount.innerHTML = plans.map((plan) => `
  <article class="panel">
    <div class="section-heading">
      <h2>${plan.label}</h2>
      <strong>$${plan.monthlyUsd}/mo</strong>
    </div>
    <p class="muted">UGX ${plan.monthlyUgx.toLocaleString()} · ${plan.model}</p>
    <p class="muted" style="margin-top:6px">${plan.features.join(" · ")}</p>
    ${plan.id === "free" ? "" : `<button data-stripe-plan="${plan.id}" class="secondary-button" style="margin-top:10px">Start 1 month trial with card</button>`}
  </article>
`).join("");

document.querySelectorAll("[data-stripe-plan]").forEach((button) => {
  button.addEventListener("click", () => startStripeCheckout(button.dataset.stripePlan));
});

document.querySelector("#mobileMoneyButton").addEventListener("click", async () => {
  const message = document.querySelector("#paymentMessage");
  try {
    message.textContent = "Starting mobile money checkout...";
    const result = await startMobileMoneyCheckout({
      phoneNumber: document.querySelector("#phoneNumber").value.trim(),
      plan: document.querySelector("#mobilePlan").value,
      currencyCode: document.querySelector("#currencyCode").value
    });
    message.textContent = `Checkout ${result.status || "started"}: ${result.transactionId || "awaiting confirmation"}`;
  } catch (error) {
    message.textContent = error.message;
  }
});
