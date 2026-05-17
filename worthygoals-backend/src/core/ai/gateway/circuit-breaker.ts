interface ProviderState {
  failures: number;
  openedAt: number | null;
}

export class CircuitBreaker {
  private readonly states = new Map<string, ProviderState>();

  constructor(
    private readonly threshold = 3,
    private readonly recoveryMs = 5 * 60 * 1000,
  ) {}

  isAvailable(provider: string): boolean {
    const s = this.state(provider);
    if (s.openedAt === null) return true;
    if (Date.now() - s.openedAt >= this.recoveryMs) return true; // half-open
    return false;
  }

  recordSuccess(provider: string): void {
    this.states.set(provider, { failures: 0, openedAt: null });
  }

  recordFailure(provider: string): void {
    const s = this.state(provider);
    s.failures += 1;
    if (s.failures >= this.threshold) s.openedAt = Date.now();
    this.states.set(provider, s);
  }

  private state(provider: string): ProviderState {
    if (!this.states.has(provider)) {
      this.states.set(provider, { failures: 0, openedAt: null });
    }
    return this.states.get(provider)!;
  }
}
