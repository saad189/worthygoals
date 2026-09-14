/**
 * Guards D5: the AI-backed routes must not run under the default timeout.
 *
 * The shared axios instance had a single global timeout: 10000 and no
 * per-request override, so the client aborted at exactly the backend's own
 * "<=10s worst case" AI budget — the request failed by configuration. The
 * backend had no AI timeout at all, so it kept generating and billing after
 * the client gave up.
 */
import ApiService, { AI_REQUEST_TIMEOUT_MS } from '../api.service';
import { goalsApiService } from '../goals.service';
import { weeklyReviewApiService } from '../weekly-review.service';

jest.mock('../api.service', () => ({
  __esModule: true,
  AI_REQUEST_TIMEOUT_MS: 60_000,
  default: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

const api = ApiService as jest.Mocked<typeof ApiService>;

describe('AI-backed requests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gives the weekly review the AI timeout, not the default', async () => {
    await weeklyReviewApiService.get();

    expect(api.get).toHaveBeenCalledWith('/weekly-review', undefined, {
      timeout: AI_REQUEST_TIMEOUT_MS,
    });
  });

  it('gives goal proposal the AI timeout', async () => {
    await goalsApiService.propose('run a marathon');

    expect(api.post).toHaveBeenCalledWith(
      '/goals/propose',
      { raw: 'run a marathon' },
      { timeout: AI_REQUEST_TIMEOUT_MS },
    );
  });

  it('uses a timeout well clear of the backend AI budget', () => {
    expect(AI_REQUEST_TIMEOUT_MS).toBeGreaterThan(10_000);
  });
});
