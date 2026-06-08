const PREFIX = "draftmate:";

function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function getSession() {
  return read("session");
}

export function setSession(session) {
  write("session", session);
}

export function clearSession() {
  localStorage.removeItem(`${PREFIX}session`);
}

export function getPlan() {
  return getSession()?.plan || "free";
}

export function setPlan(plan) {
  const session = getSession() || { email: "guest@draftmate.local", token: "guest" };
  setSession({ ...session, plan });
}

export function getByoKey() {
  return read("byoKey");
}

export function setByoKey(provider, apiKey, model = "", endpoint = "") {
  write("byoKey", { provider, apiKey, model, endpoint, savedAt: new Date().toISOString() });
}

export function clearByoKey() {
  localStorage.removeItem(`${PREFIX}byoKey`);
}

export function getPreference(key, fallback = null) {
  return read(`pref:${key}`, fallback);
}

export function setPreference(key, value) {
  write(`pref:${key}`, value);
}

export function getUsageState() {
  return read("usage", {});
}

export function setUsageState(state) {
  write("usage", state);
}
