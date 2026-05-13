/**
 * Worthy Goals — Design Tokens
 *
 * Core palette:
 *   Paper  #F4EFE3  warm cream — primary surface
 *   Ink    #1A1714  dark charcoal — primary text
 *   Accent #C04124  burnt orange/rust — CTAs, highlights, personality branding
 *
 * Dark mode uses inverted-warm values that preserve the organic feel.
 * Light mode is the canonical design; dark is planned for V1.5.
 */

// --- Primitives ---
const Primitive = {
  paper: '#F4EFE3',
  paperDark: '#1A1714',
  canvas: '#EFE9D8',
  canvasDark: '#141210',
  ink: '#1A1714',
  inkDark: '#EDE8DF',
  inkMuted: '#8B8174',
  inkMutedDark: '#6B6560',
  accent: '#C04124',
  accentSubtle: 'rgba(192, 65, 36, 0.12)',
  accentSubtleDark: 'rgba(192, 65, 36, 0.20)',
  overlay: 'rgba(26, 23, 20, 0.06)',
  overlayDark: 'rgba(237, 232, 223, 0.06)',
};

// --- Semantic tokens (light + dark) ---
const Colors = {
  light: {
    // Surfaces
    background: Primitive.paper,
    surface: Primitive.paper,
    canvas: Primitive.canvas,
    // Text
    text: Primitive.ink,
    textMuted: Primitive.inkMuted,
    // Interactive
    tint: Primitive.accent,
    tabIconDefault: Primitive.inkMuted,
    tabIconSelected: Primitive.accent,
    // Accent helpers
    accentSubtle: Primitive.accentSubtle,
    overlay: Primitive.overlay,
    // Border
    border: 'rgba(26, 23, 20, 0.12)',
  },
  dark: {
    // Surfaces
    background: Primitive.paperDark,
    surface: Primitive.paperDark,
    canvas: Primitive.canvasDark,
    // Text
    text: Primitive.inkDark,
    textMuted: Primitive.inkMutedDark,
    // Interactive
    tint: Primitive.accent,
    tabIconDefault: Primitive.inkMutedDark,
    tabIconSelected: Primitive.accent,
    // Accent helpers
    accentSubtle: Primitive.accentSubtleDark,
    overlay: Primitive.overlayDark,
    // Border
    border: 'rgba(237, 232, 223, 0.12)',
  },
} as const;

export { Primitive };
export default Colors;
