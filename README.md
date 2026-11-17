# Plot Twist · The Midnight Archive

A cinematic trivia escape adventure by **Raeesa Samaai**. Three rooms, fifteen questions, one way out.

Built to explore the overlap between frontend engineering, accessible interaction design, motion, and storytelling. This is a working single-player MVP: no registration, subscription, database, or payment is needed to play.

## Play

1. Choose a nickname and difficulty: Curious (easy), Daring (medium), or Fearless (hard).
2. Answer five questions in each room. Three correct answers unlock the next room.
3. Collect the brass key, silver compass, and final page to escape.

Each correct answer earns 100 points. Consecutive correct answers in a room add bonuses of 20, 40, then 60 points (capped). One optional clue per room removes two incorrect choices for 25 points. If a room remains locked, review the answers and retry. The failed attempt's score and clue cost reset; the retry count remains. The highest possible score is 2,040.

There is no timer. Keyboard users can select answers with A–D or 1–4 when the question is focused, or use Tab and Enter. Every answer saves automatically in the current browser. Refreshing preserves progress; clearing site data removes it.

## What is included

- Responsive, original art direction with custom SVG artwork and self-hosted fonts.
- Complete three-room game, feedback, answer journal, replay, and copyable results.
- Live questions from Open Trivia DB, fetched in one 15-question batch.
- Explicitly labelled archive edition with 30 original backup questions if the service fails, is throttled, or returns invalid data. Archive questions use mixed difficulty.
- Runtime-validated game saves and API responses.
- Secure, optional APInex narrator endpoint, with no provider key in browser code.
- Original narration fallback when AI is disabled, unconfigured, invalid, slow, or unavailable.
- Reduced-motion support, focus management, semantic controls, native modal focus handling, optional sound, and accessible feedback.
- Automated rule/endpoint tests and GitHub Actions validation.
- A self-contained Worker production build and optional Cloudflare deployment configuration.

## Run locally

Requirements: Node.js **22 or later** and npm.

```sh
npm ci
npm run dev
```

Vite serves the UI. Live trivia works directly; AI requests fall back to the original story because Vite does not run the Worker endpoint.

To run the **complete production app including the server**:

```sh
npm run build
npx wrangler dev
```

Open the local URL printed by Wrangler. No Cloudflare login is needed for local development. `GET /api/health` reports whether narration is configured (it does not verify provider access).

## Optional free AI setup

**Live AI is not configured in the initial deployment. The entire game is playable with the original story.**

1. Check APInex's current free access conditions and obtain a key without buying credits or a subscription. If free access is unavailable to your account, keep original narration enabled.
2. Copy `.env.example` to `.dev.vars` and enter your key there for local Worker development.
3. Keep `APINEX_MODEL` set to a current `free/*` model that your account can actually access. The default is `free/claude-opus-4.6`; catalog availability may change.
4. For a Cloudflare deployment, set `APINEX_API_KEY` with `npx wrangler secret put APINEX_API_KEY`. For Sites hosting, set it through the Site's runtime environment-variable tool/settings. Never commit the key or put it in a `VITE_*` variable.

The server accepts a small validated nickname/difficulty payload, requests one JSON story, validates it, and falls back safely. It never asks the model to generate questions, determine correct answers, calculate scores, or change room-unlock rules. The model and fixed provider URL are controlled server-side. Model IDs without the `free/` prefix are rejected, with **no paid fallback**. The prefix itself does not guarantee the provider's current billing terms; verify account access before configuring the key.

The narrator has an 8-second timeout, per-IP and per-instance request caps, a bounded short-lived story cache, and a 512-byte input limit. Caps and caches are in memory and reset across Worker isolates; they are not a global abuse-prevention system. For a widely promoted deployment, add a durable global quota and/or Turnstile. Leave paid billing disabled and original narration available.

## Build, tests, and deployment

```sh
npm test        # scoring, room gates, hints, retries, save validation, narrator
npm run build  # TypeScript check + Vite + standalone Worker bundle
npm run check  # both
```

The build embeds the UI, fonts, and licences in `dist/server/index.js`. It requires no asset binding and can be deployed as a Worker ES module. `.openai/hosting.json` records the associated private Sites preview. It contains no secrets.

For your own **Cloudflare Free plan** deployment:

```sh
npx wrangler login
npm run deploy:cloudflare
```

Use the provided `workers.dev` address to avoid purchasing a domain. Check current free-plan limits before deploying; no hosting provider's limits or continued availability are guaranteed. The GitHub workflow validates code and builds only; it does not deploy or require cloud secrets.

## Architecture

```text
src/App.tsx                 Screens, keyboard interaction, and accessible dialogs
src/components/ArchiveArt   Original illustrated doorway
src/lib/game.ts             Pure game transitions and scoring
src/lib/api.ts              Trivia and narration adapters, validation, fallbacks
src/lib/types.ts            Zod schemas and TypeScript types
src/lib/storage.ts          Browser save adapter and recovery
src/lib/story.ts            Room definitions and original story
src/lib/fallback.ts         Original question bank
server/worker.ts            Static delivery, security headers, narrator, health
scripts/build-server.mjs    Builds the self-contained production Worker
```

Question data is fetched once and persisted with the run, so continuing an adventure does not need another trivia request. Display strings are rendered as React text. Open Trivia DB's entity-encoded strings are decoded to text, never inserted as executable HTML. The UI makes one provider request per new game and respects a six-second browser cooldown; failed/rate-limited responses use the archive bank. No hidden repeat-fetch loop.

## Known limits and future work

- Local progress is single-browser, not cloud-synchronised. A storage adapter isolates this so accounts and cloud saves can be added later.
- Questions and correct answers exist in client state. Scores are for casual play; they are **not trustworthy for a competitive leaderboard**. Add authoritative server sessions before competitive play.
- The fallback bank is finite and uses mixed difficulty. Retrying a room reuses its questions intentionally as a learning opportunity.
- Narration is optional. Provider access, quotas, model availability, and output quality can vary. This MVP makes no guarantee of unlimited live AI.
- No service worker: an already-loaded run can be played during a network interruption, but this is not an installable offline-first PWA.
- Test evidence and design decisions are recorded in `docs/CASE_STUDY.md`.

Potential upgrades: additional authored adventures, selectable trivia categories, daily seeds, persistent profiles, a larger original bank, a database-backed narrator quota, and shareable server-verified challenges. New stories can reuse the game engine and API adapters.

## Privacy, attribution, and licensing

No analytics or account system. Progress and nickname are stored in localStorage. The trivia provider receives normal network request information. With AI enabled and configured, the entered nickname and difficulty are sent to APInex. Use a nickname and do not enter private information. Hosting/API providers may retain standard request logs.

Live trivia comes from [Open Trivia DB](https://opentdb.com/) under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Choice order and presentation are adapted. The licence applies to the trivia data, not to independent application code. The original backup questions do not copy this dataset.

Application code, original story, and original SVG artwork: MIT (see `LICENSE`). Manrope and Cormorant Garamond: SIL Open Font Licence. Lucide icons: ISC. Font and icon licence texts are distributed under `public/licenses/` and served by the application.

Created for [Raeesa Samaai's portfolio](https://github.com/raeesasamaai).
