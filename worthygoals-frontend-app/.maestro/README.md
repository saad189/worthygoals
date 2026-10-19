# E2E flows (Maestro)

Smoke flows for the core journeys, run against the iOS simulator. They only
navigate and read — nothing is submitted — so they can run against your dev
data repeatedly.

| Flow | Covers |
|---|---|
| `01-today` | today renders (mentor card, up next, week strip) and all tabs |
| `02-goal-answer` | goals → a goal → "Did you do it?" → Not today → reason picker → back |
| `03-goal-wizard` | + New goal opens the wizard on step 1 |
| `04-team-messages` | team lists the three mentors → messages → back |
| `05-feed-me` | feed and me render |

## Run

Prerequisites: Java 17 and the Maestro CLI (`brew install openjdk@17` and
`brew install mobile-dev-inc/tap/maestro`), the backend on :3003, Metro on
:8081, the app installed on a booted simulator (`npx expo run:ios`) and
**signed in** (sign-up needs a real inbox, so flows assume an account).

```bash
npm run e2e:ios
```

Selectors are VoiceOver labels (`accessibilityLabel`), not visible text, where
they differ — e.g. tabs are `"goals, tab, 2 of 6"`, task rows `"Answer for …"`.
If a flow can't find something, `maestro hierarchy` shows what the app exposes.
