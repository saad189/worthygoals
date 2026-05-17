import { SafetyService } from '../safety.service';

describe('SafetyService', () => {
  const svc = new SafetyService();

  describe('isCrisisSignal', () => {
    it('returns false for empty string', () => {
      expect(svc.isCrisisSignal('')).toBe(false);
    });

    it('returns false for normal reflection text', () => {
      expect(svc.isCrisisSignal('I felt tired but pushed through it.')).toBe(false);
    });

    it('returns false for "not going well" without crisis terms', () => {
      expect(svc.isCrisisSignal('Things are not going well today.')).toBe(false);
    });

    it('detects "hurt myself"', () => {
      expect(svc.isCrisisSignal('I just want to hurt myself.')).toBe(true);
    });

    it('detects suicidal keyword', () => {
      expect(svc.isCrisisSignal('Having suicidal thoughts lately')).toBe(true);
    });

    it('detects "want to die"', () => {
      expect(svc.isCrisisSignal('I want to die')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(svc.isCrisisSignal('CANT GO ON WITH THIS')).toBe(true);
    });

    it('detects "self-harm"', () => {
      expect(svc.isCrisisSignal('been thinking about self-harm again')).toBe(true);
    });
  });

  describe('getCrisisResponse', () => {
    it('returns a non-empty string with helpline info', () => {
      const r = svc.getCrisisResponse();
      expect(r.length).toBeGreaterThan(50);
      expect(r).toContain('988');
    });
  });
});
