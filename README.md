# Pro Dialer

A cold-calling softphone that fixes Zoiper Free's biggest limitation: **multiple Telnyx numbers at the same time**, with per-call number picking, recording, and a built-in spreadsheet-style CRM.

- Web app (Next.js on Vercel)
- Telnyx WebRTC SDK for the actual calling (same Opus codec as Zoiper, same call quality)
- Neon Postgres for leads / call history / recordings metadata
- Telnyx hosts the recordings — we just store and play them

---

## How the multi-number trick works

You do **not** need multiple SIP accounts. On Telnyx:

- One **Credential Connection** (one username/password)
- Every DID you own is assigned to that connection

The app registers **once** with that single connection. For each outbound call we pass `callerNumber` — Telnyx uses whichever of your DIDs you picked as caller ID. For inbound, every DID rings the same connection. This is exactly what Zoiper Free blocks (its free tier locks you to one registration per number). We bypass it.

---

## One-time setup

### 1. Telnyx

1. **Buy / list your numbers** in the [Telnyx Portal](https://portal.telnyx.com) → Numbers → My Numbers.
2. Create a **Credential Connection**: Voice → SIP Trunking → Add SIP Connection → choose **Credentials**. Save the username and password — you'll need these as `TELNYX_SIP_USERNAME` / `TELNYX_SIP_PASSWORD`.
3. On that Connection, enable **Outbound** → **Caller ID Override** so we can set the From number per call. Enable **Call Recording** (all inbound + outbound). Set **Audio Codec** preference to OPUS, then PCMU.
4. Assign **all your DIDs** to this Connection: for each number, Numbers → click number → Connection → pick the one you created.
5. Create an **API Key**: API Keys → Create. Copy as `TELNYX_API_KEY`.
6. Note the **Connection ID** (the numeric ID on the Connection page) as `TELNYX_CONNECTION_ID`.
7. Webhook URL — fill this in **after** you deploy. Goes under the Connection → Webhook URL → `https://your-app.vercel.app/api/telnyx/webhook`.

### 2. GitHub

```bash
git init
git add .
git commit -m "initial"
gh repo create pro-dialer --private --source=. --push
```
(Or push to a repo created in the GitHub UI.)

### 3. Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → Project → import the GitHub repo.
2. Framework: Next.js (auto-detected). Click **Deploy** (it'll fail the first build — that's fine, env vars aren't set yet).
3. In the project dashboard → **Storage** → **Create Database** → **Neon** → Continue → Create. Vercel auto-injects `DATABASE_URL`.
4. Project → **Settings** → **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `APP_PASSWORD` | a long random string — this is your login password |
   | `SESSION_SECRET` | run `openssl rand -base64 32` and paste the result |
   | `TELNYX_API_KEY` | from Telnyx portal |
   | `TELNYX_SIP_USERNAME` | from your Credential Connection |
   | `TELNYX_SIP_PASSWORD` | from your Credential Connection |
   | `TELNYX_CONNECTION_ID` | numeric ID |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

5. Trigger a redeploy: **Deployments** → click `…` on the latest → **Redeploy**.

### 4. Initialize the database

From your laptop, once `DATABASE_URL` is in Vercel:

```bash
# Pull Vercel's env vars locally
npx vercel link        # link this folder to the Vercel project
npx vercel env pull .env.local
npm install
npm run db:push        # creates the tables in Neon
```

### 5. Add your numbers in the app

1. Open the deployed URL, log in with `APP_PASSWORD`.
2. Go to **Settings** → add each of your Telnyx DIDs in E.164 format (`+14155551234`) with an optional label.
3. Go to **Settings** again, copy the **Webhook URL**, paste it into the Telnyx Credential Connection → Webhook URL field. Save.

### 6. Make a test call

1. **Dialer** page → wait for status dot to turn green (Registered).
2. Pick a "From" number from the dropdown.
3. Type a destination → hit **Call**.
4. After hangup, go to **Recordings** → the call should appear within a few seconds; the recording shows up within ~30s.

---

## Local development

```bash
cp .env.example .env.local      # fill in values
npm install
npm run db:push
npm run dev
```

Open `http://localhost:3000`. For webhooks during local dev, use [Telnyx's webhook forwarding](https://developers.telnyx.com/docs/v2/development/webhook-testing) or `ngrok http 3000` and paste the ngrok URL into Telnyx.

---

## Project structure

```
src/
  app/
    (app)/                     # authed pages
      dialer/                  # number-picker + keypad
      leads/                   # spreadsheet CRM
      recordings/              # call history + playback
      settings/                # add numbers, see webhook URL
    api/
      telnyx/
        webhook/               # receives call.* events
        credentials/           # serves SIP creds to authed client
      leads/                   # CRUD + import
      calls/                   # log + disposition
      columns/                 # custom CRM columns
      numbers/                 # your DIDs
      auth/logout/
    login/                     # password login
  components/
    TelnyxProvider.tsx         # WebRTC singleton + active-call state
    CallOverlay.tsx            # floating in-call controls
    Dialpad.tsx
    NumberPicker.tsx
    LeadsGrid.tsx              # editable Google-Sheets-style grid
    Nav.tsx
  db/
    schema.ts                  # Drizzle tables
    index.ts                   # Neon connection
  lib/
    auth.ts                    # cookie sessions (jose)
    telnyx-server.ts           # server SDK + types
    telnyx-store.ts            # zustand store (client)
    utils.ts                   # formatters, E.164 helpers
  middleware.ts                # auth guard
```

---

## What's next (planned, not in v1)

- **Mobile app** — React Native + Expo + `@telnyx/react-native-webrtc` + `react-native-callkeep`. Shares this same backend.
- **Per-call disposition prompt** after every hangup.
- **Auto-rotation rules** (round-robin / least-used-today / area-code-match).
- **Power dialer mode** — select N leads, auto-advance after each disposition.
- **Transcription + search** via Telnyx's built-in transcription.

---

## Costs (solo use)

- Vercel Hobby: **$0**
- Neon Free (0.5 GB): **$0**
- GitHub: **$0**
- Telnyx: unchanged from what you already pay, plus **$0.002/min** recording
