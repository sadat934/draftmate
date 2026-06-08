export function renderRequestCounter(mount, usage) {
  const unlimited = usage.limit === Infinity;
  const label = unlimited ? "Unlimited requests" : `${usage.remaining} of ${usage.limit} requests remaining today`;
  const percent = unlimited ? 100 : Math.round((usage.remaining / usage.limit) * 100);

  mount.innerHTML = `
    <section class="panel">
      <div class="section-heading">
        <h2>Daily usage</h2>
        <span class="muted">${label}</span>
      </div>
      <div class="usage-meter" aria-hidden="true"><span style="width: ${percent}%"></span></div>
    </section>
  `;
}
