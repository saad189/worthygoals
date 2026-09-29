<!-- Generated: 2026-09-13 (ECC-11) | Files scanned: 173 ts/tsx | ~11.1k LOC | Token estimate: ~950 -->

# Frontend app — `worthygoals-frontend-app`

Expo 54 · React Native 0.81 · React 19 · expo-router (file-based) · TanStack Query.
`strict: true`, `tsc --noEmit` clean, 8 suites / 36 tests — **none render a screen** (open item #39).

## Route tree (`app/`)

```
_layout.tsx                    root: QueryClient, theme, auth bootstrap, push handler
index.tsx                      entry redirect
custom-splash-screen.tsx
auth/           _layout · start-auth · login · register · verify-email
                reset-password · new-password
profile/        register-profile-screen          ← mandatory; location permission
                                                   quits the app on deny (item #40)
journey/        1-intro · 2-tone-test · 3-your-team · 4-confirm   (onboarding)
(tabs)/         _layout · home-screen · todo-list-screen · chat-list-screen
                mentors-list-screen · feed-screen · me-screen
todo/           todo-create · todo-detail · todo-edit
                todo-propose (AI) · todo-personality
chat/           chat-view-screen · chat-settings-screen · image-viewer-screen
mentors/        mentor-detail-screen · image-viewer-screen
inspiration/    default-screen (masonry board) · image-viewer-screen
status/         compose-screen
review/         review-screen (weekly review)
design-system.tsx · modal.tsx · +not-found.tsx · +html.tsx
```

Every `Stack.Screen` sets `headerShown: false`; screens draw the `Header`
primitive themselves (`onBack` / `right` slots).

## State separation

| Kind | Owner |
|---|---|
| Server state | TanStack Query — one `hooks/use*.tsx` per resource |
| Auth session | `hooks/useAuth.tsx` + `core/auth.emitter.ts`; tokens in SecureStore |
| Query client | `core/queryClient.ts` — persisted to **AsyncStorage, unencrypted** (item #38) |
| Theme | `hooks/useAppTheme.tsx` → `core/theme.ts` + `constants/tokens.ts` |
| Offline writes | `hooks/useOutboxDrain.ts` |
| Toasts | `hooks/useToastNotification.tsx` (react-native-paper `Snackbar`) |

## `services/` — 16 modules, one per backend surface

`api.service.ts` (axios instance, auth header, refresh) is the base; then
`AuthService`, `UserService`, `goals`, `tasks`, `mentor`, `messages`,
`conversations`, `dashboard`, `board`, `status`, `weekly-review`, `media`,
`onboarding`, `push`, `observability` (Sentry + PostHog).

## `components/`

`ui/` — primitives (`Text`, `Header`, `Card`, `UserAvatar`, …; the hex-lint gate
forbids raw colour literals here). `Common/`, `Mentors/`, `Icons/`, `brand/`.

## `constants/`

`Brand.ts` (display name, has a space) · `Storage.ts` (**`STORAGE_NS`
slug — never derive keys from `Brand`, SecureStore rejects spaces; PR #66**) ·
`Colors.ts` / `tokens.ts` · `Config.ts` · `Routes.ts` · `Personalities.ts` ·
`Schedule.ts`.

## `models/` — 18 hand-written interfaces

`goal.interface.ts`, `status.interface.ts` and `weekly-review.interface.ts`
duplicate backend DTOs with "keep in sync" comments. Generated types live in
`types/api.gen.ts` and cover only 8 of 48 operations. Open item #4.

## Known traps

- `@gorhom/bottom-sheet@4.6.4` calls `useAnimatedGestureHandler`, removed in
  `reanimated@4.1.7` — **every bottom sheet throws on mount**, taking the todo
  tab with it (item #34).
- `eas.json` `production` profile is empty: no `env`, so a production build has
  no `EXPO_PUBLIC_API_URL` (item #37); no versioning either (ECC-10 M4).
