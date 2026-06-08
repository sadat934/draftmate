import { CONFIG } from "../utils/config.js";

export function renderUpgrade(mount, { visible, reason = "" } = {}) {
  if (!visible) {
    mount.innerHTML = "";
    return;
  }

  const paidPlans = [CONFIG.plans.byo, CONFIG.plans.pro, CONFIG.plans.business];
  mount.innerHTML = `
    <section class="panel">
      <div class="section-heading">
        <h2>Upgrade DraftMate</h2>
      </div>
      <p class="muted">${reason || "Unlock unlimited writing help and premium models."}</p>
      <div class="upgrade-grid">
        ${paidPlans.map((plan) => `
          <article class="upgrade-card">
            <strong>${plan.label}</strong>
            <p>$${plan.monthlyUsd}/mo · UGX ${plan.monthlyUgx.toLocaleString()}</p>
          </article>
        `).join("")}
      </div>
      <a class="primary-button" style="display:inline-flex;align-items:center;margin-top:10px;text-decoration:none" href="../payments/plans.html">View plans</a>
    </section>
  `;
}
