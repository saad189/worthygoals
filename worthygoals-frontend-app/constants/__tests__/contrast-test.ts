/**
 * Guards H1 — WCAG 2.2 §1.4.3 (Contrast Minimum) for the text layer.
 *
 * Three of the app's seven text variants failed by default: textMuted
 * (#8B8174) was 3.33:1 on paper and is the default colour of muted, eyebrow
 * and mono — the entire secondary/metadata layer. textFaint was 1.53:1 and is
 * the placeholderTextColor of Field, the chat composer and the completion
 * sheet, plus the body colour of read conversations. Dark mode failed
 * identically at 3.11:1 and 1.24:1.
 *
 * These are computed, not eyeballed, so a palette edit that reintroduces the
 * problem fails here.
 */
import { Colors } from '../Colors';

const AA_NORMAL_TEXT = 4.5;

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe('colour contrast (WCAG AA, normal text)', () => {
  it('computes a known ratio correctly', () => {
    // Black on white is the canonical 21:1.
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  // Every text role against both surfaces it can land on, in both schemes.
  const SCHEMES = ['light', 'dark'] as const;
  const TEXT_ROLES = ['text', 'textMuted', 'textFaint', 'textAccent'] as const;
  const SURFACES = ['surface', 'canvas'] as const;

  for (const scheme of SCHEMES) {
    for (const role of TEXT_ROLES) {
      for (const surface of SURFACES) {
        it(`${scheme}: ${role} on ${surface} meets ${AA_NORMAL_TEXT}:1`, () => {
          const palette = Colors[scheme] as Record<string, string>;
          const ratio = contrastRatio(palette[role], palette[surface]);
          expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        });
      }
    }
  }

  it('keeps a visible tonal step between muted and faint', () => {
    for (const scheme of SCHEMES) {
      const palette = Colors[scheme] as Record<string, string>;
      const muted = contrastRatio(palette.textMuted, palette.surface);
      const faint = contrastRatio(palette.textFaint, palette.surface);
      // Compliance must not flatten the hierarchy into one grey.
      expect(muted).toBeGreaterThan(faint);
    }
  });

  it('keeps white legible on the accent fill', () => {
    expect(
      contrastRatio('#FFFFFF', (Colors.light as Record<string, string>).buttonBackground),
    ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});
