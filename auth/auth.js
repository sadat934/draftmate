import { apiUrl, CONFIG } from "../utils/config.js";
import { setSession } from "../utils/storage.js";

document.querySelector("#signupButton").addEventListener("click", () => submit("signup"));
document.querySelector("#loginButton").addEventListener("click", () => submit("login"));

async function submit(mode) {
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;
  const message = document.querySelector("#authMessage");

  if (!email || password.length < 8) {
    message.textContent = "Enter an email and a password with at least 8 characters.";
    return;
  }

  try {
    message.textContent = "Signing in...";
    const path = mode === "signup" ? CONFIG.endpoints.signup : CONFIG.endpoints.login;
    const response = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const session = await response.json();
    setSession(session);
    window.location.replace("../taskpane/taskpane.html");
  } catch (error) {
    message.textContent = error.message;
  }
}
