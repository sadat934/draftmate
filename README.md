# DraftMate

DraftMate is a Microsoft Word task pane add-in for AI writing, grammar improvement, summarization, auto heading labels, BYO OpenAI/Claude keys, one-month trials, Stripe billing, and Africa's Talking mobile money payment scaffolding.

## Run locally

```powershell
npm start
```

The dev server serves the add-in at `http://localhost:3000`. The manifest is configured for `https://localhost:3000`, which is what Office production manifests expect. For local sideloading, either run the server behind a local HTTPS proxy/certificate or change the manifest URLs to `http://localhost:3000` during development if your Office environment allows localhost HTTP.

## Environment variables

Create these before testing live providers:

```text
MISTRAL_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_BYO=
STRIPE_PRICE_PRO=
STRIPE_PRICE_BUSINESS=
STRIPE_SUCCESS_URL=http://localhost:3000/payments/plans.html?status=success
STRIPE_CANCEL_URL=http://localhost:3000/payments/plans.html?status=cancelled
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=
AFRICASTALKING_PRODUCT_NAME=
```

Payment endpoints are intentionally server-side so Stripe and Africa's Talking secrets are never exposed in the Word add-in.
