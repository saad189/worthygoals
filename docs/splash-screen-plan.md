# Animated Splash Plan — the Cradle mark draws itself on

_Status: **Section A (RN app) IMPLEMENTED** 2026-07-11. Section B (site overlay) still
optional/not built — the nav draw-on already covers "logo animates on load."_

> Note: `ios/` and `android/` native folders already exist (prebuilt), so the
> app-icon/splash **image** changes in `app.json` won't reach a native build until
> `npx expo prebuild --clean` (or EAS build) regenerates those folders. The
> animated JS splash (`CradleMark`) works immediately in Expo Go / dev client.

The brand mark is **1C "The Cradle"**: an arc (the mentor holding the space, `--ink`),
a stem rising out of it (`--acc`/rust), and two sprout leaves (rust + ink). The
draw-on already ships on the marketing site (`worthy-goals-main-site`,
`components/logo-mark`) and fires once in the top nav on page load. This plan
extends that same motion into a proper splash on **both** surfaces.

Colors (shared tokens): ink `#1A1714` · rust/acc `#C04124` · cream `#F7F2E4` · paper `#F4EFE3`.

The mark geometry (viewBox `0 0 64 64`), reused verbatim everywhere:
- arc  `M13 32 A 19 19 0 0 0 51 32` — stroke ink, width 3.6, round cap
- stem `M32 41 C 32 35 32 29 32 23` — stroke rust, width 3.2, round cap
- leaf-L `M32 30.5 C 27 30.5 22 26.5 21.5 20.5 C 27 21.5 31 25 32 30.5 Z` — fill rust
- leaf-R `M32 27 C 37 27 42 23.5 42.5 18 C 37 19 33 22.5 32 27 Z` — fill ink

**Motion timeline (~1.35s total), identical on both platforms:**
| t (s) | element | from → to |
|-------|---------|-----------|
| 0.00–0.55 | arc  | strokeDashoffset 1 → 0 (sweeps open like a cradle) |
| 0.45–0.85 | stem | strokeDashoffset 1 → 0 (grows upward) |
| 0.80–1.25 | leaf-L | scale .2 → 1, opacity 0 → 1 (origin: base) |
| 0.95–1.40 | leaf-R | scale .2 → 1, opacity 0 → 1 |
| 1.20–1.70 | wordmark text | opacity 0 → 1, translateY 6 → 0 |

Reduced motion (`prefers-reduced-motion` / RN `AccessibilityInfo.isReduceMotionEnabled`):
skip the draw, render the final mark immediately, keep only a short fade.

---

## A. React Native app (primary — the real "splash")

Today: `app/_layout.tsx` shows the native `splash.png` (Expo) → then a JS
`CustomSplashScreen` (static text only) for a hardcoded 320ms → then the nav tree.
Deps needed are **already installed**: `react-native-svg` 15.2 + `react-native-reanimated` 3.10.

### Steps
1. **Native splash first frame** — swap `app.json` `splash.image` to a static,
   pre-draw version of the mark on paper so the OS splash and the JS splash are
   visually continuous (no flash). Set `splash.backgroundColor` `#464546` →
   `#F4EFE3` (paper) and `resizeMode` `cover` → `contain`. Generate `splash.png`
   from the mark SVG the same way the icons were (headless-Chrome rasterize, see
   `scratchpad/rasterize.mjs`).
2. **`components/brand/CradleMark.tsx`** (new) — a `react-native-svg` port of the
   mark with an `animate?: boolean` prop. Animate the two stroke `Path`s via
   `useSharedValue` + `strokeDashoffset` (set `pathLength`/measured length), and
   the two leaf `Path`s via `scale`/`opacity` on an `Animated.View`/`G`. Sequence
   with `withDelay(withTiming(...))` matching the table above. Gate on
   `AccessibilityInfo.isReduceMotionEnabled()`.
3. **`app/custom-splash-screen.tsx`** — drop `<CradleMark animate />` above the
   existing eyebrow + display copy; keep the warm-paper `Screen center` layout.
4. **`app/_layout.tsx`** — raise the `isSplashVisible` timer from `320ms` to the
   splash duration (~1600ms) so the animation is allowed to complete before the
   nav tree replaces it; keep the `loaded` font-gate. Hold `SplashScreen`
   (`preventAutoHideAsync`) until fonts are loaded (already done), and call
   `hideAsync()` on the first JS frame so the native → JS handoff is seamless.
5. Respect reduced motion end-to-end (mark + the timer can drop to ~600ms).

Touch: `app.json`, `app/custom-splash-screen.tsx`, `app/_layout.tsx`,
`components/brand/CradleMark.tsx` (new), `assets/images/splash.png` (regenerated).
No new dependencies.

## B. Marketing site (optional — nav already animates)

The nav wordmark already plays the draw-on once on load, which covers the brief.
If a full-screen intro is wanted:
1. `components/splash/SplashScreen` — fixed-overlay paper panel with a large
   `<wg-logo-mark [size]="96" [animate]="true" />` centered.
2. Show it only on first load of `/` (guard with `sessionStorage`), auto-dismiss
   after ~1.6s with a fade, and let it be skipped on click / reduced motion.
3. Risk: a full-screen splash on a **marketing** page hurts time-to-content and
   bounce. Recommend keeping the subtle nav draw-on as the default and treating
   the overlay as opt-in only. _ponytail: don't build B unless asked — the nav
   animation already delivers "logo animates on load."_

---

## Reuse note
`logo-mark.ts` (web) and `CradleMark.tsx` (RN) share the exact same path data and
timeline — if the mark ever changes, update both. Favicon/app-icon SVG sources
(`public/favicon.svg`, `scratchpad/app-icon.svg`, `scratchpad/adaptive-fg.svg`)
use the same paths too.
