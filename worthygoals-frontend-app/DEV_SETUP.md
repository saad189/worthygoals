# Dev setup — running the app on a device

## Backend

```bash
cd worthygoals-backend
npm install
npm run start:dev        # serves on :3000
```

## Frontend

```bash
cd worthygoals-frontend-app
yarn install
cp .env.local.example .env.local   # then edit EXPO_PUBLIC_API_URL (see below)
yarn start
```

## EXPO_PUBLIC_API_URL — the "Could not connect to Server" gotcha

`http://localhost:3000` only works on a **simulator/emulator**, which shares the
host's loopback. On a **physical phone** running Expo Go or a dev build,
`localhost` is the phone itself, so Chat/Mentors fail with
*"Could not connect to Server"* (defect **E-2**).

Fix: point the app at your dev machine's **LAN IP** (phone and machine on the
same Wi-Fi):

```bash
# macOS — print your LAN IP
ipconfig getifaddr en0      # e.g. 192.168.1.30
```

```dotenv
# .env.local
EXPO_PUBLIC_API_URL=http://192.168.1.30:3000
```

Notes:
- `.env.local` is gitignored — each developer sets their own IP.
- The LAN IP changes between networks; update it when you switch Wi-Fi.
- Restart the Expo dev server after editing `.env.local` (env is read at start).
- Alternatively point at a deployed backend URL (e.g. Railway) — no IP juggling.
