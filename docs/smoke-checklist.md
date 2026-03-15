# Local Smoke Checklist

Use this checklist after local app-shell or flow changes.

## Setup

1. Run `npm install` if dependencies changed.
2. Run `npm run demo:seed`.
3. Start the backend with `npm run dev:web`.
4. Copy `apps/mobile/.env.example` to `apps/mobile/.env.local` if needed.
5. Run `npm run demo:session -- demo-owner-1` and paste the token into `EXPO_PUBLIC_AIBABY_SESSION_TOKEN`.
5. Start Expo with `npm run dev:mobile`.

## Backend startup

1. Open `http://127.0.0.1:3000/` and confirm the landing page renders.
2. Open `http://127.0.0.1:3000/health` and confirm it returns `{ "ok": true, "service": "aibaby-web" }`.
3. Confirm the seeded export folder exists under `apps/web/.data/exports/`.

## Mobile flow

1. Open the app home route and confirm the seeded baby profile summary renders.
2. Open `Log a meal`.
3. Submit a text note such as `Oatmeal with banana and yogurt`.
4. Confirm or correct the generated draft.
5. Open `Today's timeline` and confirm the new meal appears.
6. Open `Summary history` and confirm daily and weekly cards render.
7. Open `7-day review`, `30-day review`, and `Reminders` from the summaries screen and confirm data loads.

## Export verification

1. On `Summary history`, tap `Create export`.
2. Confirm the app shows a backend export path.
3. Confirm the returned bundle path contains:
   - `README.md`
   - `manifest.json`
   - `diary/`
   - `metadata/`
4. Open one exported diary note and confirm it contains summary, meals, and metadata sections.

## Reset

1. Run `npm run demo:reset` when you need a clean local dataset.
