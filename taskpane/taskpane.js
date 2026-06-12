import { renderPromptBox } from "../components/promptbox.js";
import { renderResultCard } from "../components/resultcard.js";
import { renderRequestCounter } from "../components/requestcounter.js";
import { renderUpgrade } from "../components/upgrade.js";
import { buildPrompt, runAiTask } from "../ai/router.js";
import { getDocumentText, getSelectedText, insertAfterSelection, insertAtCursor, replaceSelection, applyHeadingSuggestions } from "../word/document.js";
import { clearSession, getByoKey, getPlan, getSession, setByoKey, clearByoKey } from "../utils/storage.js";
import { getUsage, incrementUsage, isTrialActive } from "../utils/tracker.js";
import { CONFIG } from "../utils/config.js";

let currentAction = "rewrite";
let currentResult = null;

function ready(callback) {
  if (window.Office) {
    Office.onReady(callback);
  } else {
    callback();
  }
}

ready(() => {
  ensureSession();
  renderShell();
  bindEvents();
  refreshSelection();
});

function ensureSession() {
  if (!getSession()) {
    window.location.replace("../auth/login.html");
  }
}

function renderShell() {
  const session = getSession();
  const byo = getByoKey();
  const plan = byo?.apiKey ? "byo" : getPlan();
  const trialText = isTrialActive(session) ? " · trial active" : "";
  document.querySelector("#planLabel").textContent = `${CONFIG.plans[plan]?.label || "Free"} plan${trialText}`;
  renderRequestCounter(document.querySelector("#counterMount"), getUsage(plan));
  renderPromptBox(document.querySelector("#promptMount"), { onSubmit: handlePrompt });
  renderUpgrade(document.querySelector("#upgradeMount"), { visible: false });

  if (byo) {
    document.querySelector("#byoProvider").value = byo.provider;
    document.querySelector("#byoKey").value = byo.apiKey;
    if (byo.model) document.querySelector("#byoModel").value = byo.model;
    if (byo.endpoint) document.querySelector("#byoEndpoint").value = byo.endpoint;
    if (byo.provider === "custom") {
      document.querySelector("#customFields").style.display = "block";
    }
  }
}

function bindEvents() {
  document.querySelectorAll(".tool-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tool-button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      currentAction = button.dataset.action;
    });
  });

  document.querySelector("#byoProvider").addEventListener("change", (e) => {
    const customFields = document.querySelector("#customFields");
    customFields.style.display = e.target.value === "custom" ? "block" : "none";
  });

  document.querySelector("#refreshSelection").addEventListener("click", refreshSelection);
  document.querySelector("#logoutButton").addEventListener("click", () => {
    clearSession();
    window.location.replace("../auth/login.html");
  });
  document.querySelector("#saveByoKey").addEventListener("click", () => {
    const provider = document.querySelector("#byoProvider").value;
    const apiKey = document.querySelector("#byoKey").value.trim();
    const model = document.querySelector("#byoModel").value.trim();
    const endpoint = document.querySelector("#byoEndpoint").value.trim();
    
    setByoKey(provider, apiKey, model, endpoint);
    alert("BYO key saved locally in this browser.");
  });
  document.querySelector("#clearByoKey").addEventListener("click", () => {
    clearByoKey();
    document.querySelector("#byoKey").value = "";
    document.querySelector("#byoModel").value = "";
    document.querySelector("#byoEndpoint").value = "";
  });
}

async function refreshSelection() {
  const selectionBox = document.querySelector("#selectionText");
  try {
    selectionBox.value = await getSelectedText();
  } catch (error) {
    selectionBox.value = "";
    showError(error.message);
  }
}

async function handlePrompt({ instruction, tone }) {
  try {
    const byo = getByoKey();
    const plan = byo?.apiKey ? "byo" : getPlan();
    const usage = getUsage(plan);
    
    if (!usage.allowed) {
      renderUpgrade(document.querySelector("#upgradeMount"), {
        visible: true,
        reason: "You have used today's free requests. Upgrade or add a BYO key for unlimited requests."
      });
      return;
    }

    const sourceText = currentAction === "headings" || !document.querySelector("#selectionText").value
      ? await getDocumentText()
      : document.querySelector("#selectionText").value;

    const prompt = buildPrompt({ action: currentAction, instruction, tone, sourceText });
    setBusy(true);
    currentResult = await runAiTask({ action: currentAction, prompt, sourceText });
    incrementUsage(plan);
    renderRequestCounter(document.querySelector("#counterMount"), getUsage(plan));

    if (currentAction === "headings") {
      currentResult.text = formatHeadingPreview(currentResult.text);
    }

    renderResult();
  } catch (error) {
    showError(error.message);
  } finally {
    setBusy(false);
  }
}

function renderResult() {
  if (!currentResult) {
    document.querySelector("#resultMount").innerHTML = "";
    return;
  }

  const resultText = currentResult.text;
  const resultRawText = currentResult.rawText;
  const action = currentAction;

  renderResultCard(document.querySelector("#resultMount"), {
    result: currentResult,
    onInsert: async () => {
      try {
        await insertAtCursor(resultText);
      } catch (error) {
        showError(error.message);
      }
    },
    onReplace: async () => {
      try {
        if (action === "headings") {
          await applyHeadingSuggestions(parseHeadingSuggestions(resultRawText || resultText));
          return;
        }
        await replaceSelection(resultText);
      } catch (error) {
        showError(error.message);
      }
    },
    onInsertAfter: async () => {
      try {
        await insertAfterSelection(resultText);
      } catch (error) {
        showError(error.message);
      }
    },
    onDiscard: () => {
      currentResult = null;
      renderResult();
    }
  });
}

function setBusy(isBusy) {
  const button = document.querySelector("#sendPrompt");
  if (!button) return;
  button.disabled = isBusy;
  button.textContent = isBusy ? "Working..." : "Run";
}

function showError(message) {
  document.querySelector("#resultMount").innerHTML = `<section class="panel"><p class="error">${message}</p></section>`;
}

function parseHeadingSuggestions(value) {
  const start = value.indexOf("[");
  const end = value.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  return JSON.parse(value.slice(start, end + 1));
}

function formatHeadingPreview(value) {
  currentResult.rawText = value;
  try {
    return parseHeadingSuggestions(value)
      .map((item) => `Paragraph ${item.paragraphIndex + 1}: Heading ${item.level} - ${item.title}`)
      .join("\n");
  } catch {
    return value;
  }
}
