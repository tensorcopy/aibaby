# Local End-to-End Flow

This is the first documented local flow that runs the current mobile app against
the current local web backend.

## Prerequisites

- install dependencies with `npm install`
- use two terminal tabs or windows
- use an iOS simulator, Android emulator, or Expo Go device

## 1. Start the local backend

From the repo root:

```sh
npm run demo:seed
npm run dev:web
```

This seeds demo data and starts the local web shell on `http://127.0.0.1:3000`.

## 2. Configure the mobile app

Create `apps/mobile/.env.local`:

```sh
cp apps/mobile/.env.example apps/mobile/.env.local
npm run demo:session -- demo-owner-1
```

Use one of these API base URLs:

- iOS simulator on the same machine: `http://127.0.0.1:3000`
- Android emulator: use the host mapping your emulator expects
- physical device on the same LAN: use your computer LAN IP, for example `http://192.168.1.10:3000`

Paste the printed token into `EXPO_PUBLIC_AIBABY_SESSION_TOKEN`.

You can leave `EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID` empty for a first-run create flow.

## 3. Start the mobile app

From the repo root:

```sh
npm run dev:mobile
```

Then open the app in your chosen simulator or device.

## 4. Walk the first-pass flow

1. Open the home route and verify the seeded baby profile loads.
2. Go to `Log a meal`.
3. Submit a text meal note such as `Oatmeal with banana and yogurt`.
4. Confirm or correct the generated draft meal record.
5. Open `Today's timeline` and verify the saved meal appears.
6. Open `Summary history`, `Review`, and `Reminders` to verify downstream reads.
7. On `Summary history`, tap `Create export` and verify the saved backend export path is returned.

## 5. Useful local reset note

The current web runtime persists local JSON/blob data under `apps/web/.data/`.

Use:

- `npm run demo:seed`
- `npm run demo:reset`
