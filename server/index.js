import { createServer as createHttpsServer } from "node:https";
import { createServer as createHttpServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, createHash } from "node:crypto";
import { homedir } from "node:os";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."));
const port = Number(process.env.PORT || 3001);
const users = new Map();
const sessions = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".png": "image/png"
};

async function startServer() {
  const certPath = join(homedir(), ".office-addin-dev-certs");
  let server;
  
  try {
    const [cert, key] = await Promise.all([
      readFile(join(certPath, "localhost.crt")),
      readFile(join(certPath, "localhost.key"))
    ]);
    
    server = createHttpsServer({ cert, key }, handleRequest);
    console.log(`DraftMate dev server running at https://localhost:${port}`);
  } catch (error) {
    console.warn("HTTPS certificates not found, falling back to HTTP");
    console.warn("Run: npx office-addin-dev-certs install");
    server = createHttpServer(handleRequest);
    console.log(`DraftMate dev server running at http://localhost:${port}`);
  }
  
  server.listen(port);
}

async function handleRequest(req, res) {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    send(res, 500, error.message);
  }
}

startServer();

async function handleApi(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (req.method === "POST" && url.pathname === "/api/auth/signup") {
    const body = await readJson(req);
    const passwordHash = hashPassword(body.password);
    const existing = users.get(body.email);
    if (existing) return send(res, 409, "Account already exists.");

    const trialEndsAt = addDays(new Date(), 30).toISOString();
    const user = { email: body.email, passwordHash, plan: "free", trialEndsAt };
    users.set(body.email, user);
    return sendJson(res, createSession(user));
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJson(req);
    const user = users.get(body.email);
    if (!user || user.passwordHash !== hashPassword(body.password)) {
      return send(res, 401, "Invalid email or password.");
    }
    return sendJson(res, createSession(user));
  }

  if (req.method === "POST" && url.pathname === "/api/ai") {
    const session = requireSession(req);
    const body = await readJson(req);
    const result = await completeAi(body, session);
    return sendJson(res, result);
  }

  if (req.method === "POST" && url.pathname === "/api/payments/mobile-money") {
    const session = requireSession(req);
    const body = await readJson(req);
    const result = await mobileMoneyCheckout(body, session);
    return sendJson(res, result);
  }

  if (req.method === "POST" && url.pathname === "/api/payments/stripe/checkout") {
    const session = requireSession(req);
    const body = await readJson(req);
    const result = await createStripeCheckout(body, session);
    return sendJson(res, result);
  }

  send(res, 404, "Not found");
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = normalize(join(root, pathname));

  if (!filePath.startsWith(root)) {
    return send(res, 403, "Forbidden");
  }

  try {
    const file = await readFile(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    res.end(file);
  } catch {
    send(res, 404, "Not found");
  }
}

async function completeAi(body, session) {
  if (body.provider === "mistral") {
    return callMistral(body.prompt);
  }

  if (body.provider === "claude") {
    return callClaude(body.prompt, session);
  }

  return { provider: "DraftMate Mock", text: fallbackCompletion(body.prompt) };
}

async function callMistral(prompt) {
  if (!process.env.MISTRAL_API_KEY) {
    return { provider: "Mistral mock", text: fallbackCompletion(prompt) };
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return { provider: "Mistral", text: data.choices?.[0]?.message?.content?.trim() || "" };
}

async function callClaude(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { provider: "Claude mock", text: fallbackCompletion(prompt) };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 2200,
      temperature: 0.35,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return { provider: "Claude", text: data.content?.map((part) => part.text || "").join("").trim() || "" };
}

async function mobileMoneyCheckout(body, session) {
  const planPrices = { byo: 11500, pro: 30500, business: 76000 };
  const amount = planPrices[body.plan];
  if (!amount) throw new Error("Unsupported plan.");

  if (!process.env.AFRICASTALKING_API_KEY) {
    return {
      provider: "Africa's Talking mock",
      status: "PendingConfirmation",
      transactionId: `mock-${randomUUID()}`,
      phoneNumber: body.phoneNumber,
      plan: body.plan,
      trialDays: 30
    };
  }

  const response = await fetch("https://payments.africastalking.com/mobile/checkout/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apiKey: process.env.AFRICASTALKING_API_KEY
    },
    body: JSON.stringify({
      username: process.env.AFRICASTALKING_USERNAME || "sandbox",
      productName: process.env.AFRICASTALKING_PRODUCT_NAME,
      phoneNumber: body.phoneNumber,
      currencyCode: body.currencyCode || "UGX",
      amount
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  updateUserPlan(session.email, body.plan);
  return { ...data, trialDays: 30 };
}

async function createStripeCheckout(body, session) {
  const priceId = {
    byo: process.env.STRIPE_PRICE_BYO,
    pro: process.env.STRIPE_PRICE_PRO,
    business: process.env.STRIPE_PRICE_BUSINESS
  }[body.plan];

  if (!priceId) throw new Error("Set the Stripe price ID for this plan in the environment.");

  if (!process.env.STRIPE_SECRET_KEY) {
    return { url: `/payments/plans.html?status=mock-stripe&plan=${encodeURIComponent(body.plan)}` };
  }

  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/payments/plans.html?status=success",
    cancel_url: process.env.STRIPE_CANCEL_URL || "http://localhost:3000/payments/plans.html?status=cancelled",
    client_reference_id: session.email,
    customer_email: session.email,
    "subscription_data[trial_period_days]": "30"
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function createSession(user) {
  const token = randomUUID();
  const session = { token, email: user.email, plan: user.plan, trialEndsAt: user.trialEndsAt };
  sessions.set(token, session);
  return session;
}

function requireSession(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  return sessions.get(token) || { email: "guest@draftmate.local", plan: "free" };
}

function updateUserPlan(email, plan) {
  const user = users.get(email);
  if (!user) return;
  user.plan = plan;
}

function fallbackCompletion(prompt) {
  if (prompt.includes("Return JSON only")) {
    return JSON.stringify([
      { paragraphIndex: 0, level: 1, title: "Introduction" },
      { paragraphIndex: 2, level: 2, title: "Key Discussion" },
      { paragraphIndex: 5, level: 2, title: "Conclusion" }
    ], null, 2);
  }

  return "DraftMate is running in mock mode because no AI provider key is configured yet. Add the relevant environment variable to receive live AI responses.\n\n" + prompt.slice(0, 700);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(res, data) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function send(res, status, message) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}

function hashPassword(password) {
  return createHash("sha256").update(String(password)).digest("hex");
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
