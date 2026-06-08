import { CONFIG } from "../utils/config.js";

export function renderPromptBox(mount, { onSubmit }) {
  mount.innerHTML = `
    <section class="panel">
      <div class="section-heading">
        <h2>Instruction</h2>
        <span class="muted" id="charCount">0/${CONFIG.prompt.maxCharacters}</span>
      </div>
      <textarea id="promptInput" maxlength="${CONFIG.prompt.maxCharacters}" placeholder="Tell DraftMate what to do with the selected text or document."></textarea>
      <div class="prompt-actions">
        <select id="toneSelect" aria-label="Tone">
          ${CONFIG.prompt.tones.map((tone) => `<option value="${tone}">${tone}</option>`).join("")}
        </select>
        <button id="sendPrompt" class="primary-button">Run</button>
      </div>
    </section>
  `;

  const input = mount.querySelector("#promptInput");
  const charCount = mount.querySelector("#charCount");
  input.addEventListener("input", () => {
    charCount.textContent = `${input.value.length}/${CONFIG.prompt.maxCharacters}`;
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      mount.querySelector("#sendPrompt").click();
    }
  });
  mount.querySelector("#sendPrompt").addEventListener("click", () => {
    onSubmit({
      instruction: input.value.trim(),
      tone: mount.querySelector("#toneSelect").value
    });
  });
}
