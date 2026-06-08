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
    
    // Offline authentication - store in localStorage
    const users = JSON.parse(localStorage.getItem('draftmate_users') || '{}');
    
    if (mode === "signup") {
      if (users[email]) {
        throw new Error("Account already exists. Please sign in.");
      }
      
      // Create new user
      const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      users[email] = {
        email,
        passwordHash: btoa(password), // Simple encoding (not secure, but works offline)
        plan: "free",
        trialEndsAt,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('draftmate_users', JSON.stringify(users));
    } else {
      // Login
      if (!users[email]) {
        throw new Error("Account not found. Please create an account.");
      }
      
      if (users[email].passwordHash !== btoa(password)) {
        throw new Error("Incorrect password.");
      }
    }
    
    // Create session
    const session = {
      token: 'offline_' + Math.random().toString(36).substring(2),
      email,
      plan: users[email].plan,
      trialEndsAt: users[email].trialEndsAt
    };
    
    setSession(session);
    window.location.replace("../taskpane/taskpane.html");
    
  } catch (error) {
    message.textContent = error.message;
  }
}
