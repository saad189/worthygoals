import { ordinal } from '../Ordinal';

// The seriousness-check eyebrow renders "3RD MISS THIS WEEK" (screen 11) —
// the ordinal has to hold for the teens and every suffix class.
describe('ordinal', () => {
  it.each([
    [1, '1ST'],
    [2, '2ND'],
    [3, '3RD'],
    [4, '4TH'],
    [11, '11TH'],
    [12, '12TH'],
    [13, '13TH'],
    [21, '21ST'],
    [22, '22ND'],
    [23, '23RD'],
    [100, '100TH'],
  ])('ordinal(%i) → %s', (n, expected) => {
    expect(ordinal(n)).toBe(expected);
  });
});
