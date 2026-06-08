export function renderResultCard(mount, { result, onInsert, onReplace, onInsertAfter, onDiscard }) {
  if (!result) {
    mount.innerHTML = "";
    return;
  }

  mount.innerHTML = `
    <section class="panel">
      <div class="section-heading">
        <h2>Result</h2>
        <span class="muted">${result.provider || "AI"}</span>
      </div>
      <div class="result-body">${escapeHtml(result.text)}</div>
      <div class="result-actions">
        <button id="replaceResult" class="primary-button">Replace</button>
        <button id="insertResult" class="secondary-button">Insert</button>
        <button id="insertAfterResult" class="secondary-button">After</button>
        <button id="discardResult" class="ghost-button">Discard</button>
      </div>
    </section>
  `;

  mount.querySelector("#replaceResult").addEventListener("click", onReplace);
  mount.querySelector("#insertResult").addEventListener("click", onInsert);
  mount.querySelector("#insertAfterResult").addEventListener("click", onInsertAfter);
  mount.querySelector("#discardResult").addEventListener("click", onDiscard);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
