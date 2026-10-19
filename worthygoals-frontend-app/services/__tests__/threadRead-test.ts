/** QA-40: the messages list's unread dot was hard-coded to "read". */
import { isThreadRead } from '../conversations.service';

jest.mock('../api.service', () => ({ __esModule: true, default: {} }));

const at = (iso: string) => `2026-10-19T${iso}:00.000Z`;

describe('isThreadRead', () => {
  it('is unread when the mentor wrote after the user last looked', () => {
    expect(isThreadRead({ role: 'mentor', createdAt: at('10:05') }, at('10:00'))).toBe(false);
  });

  it('is read once the user has had it open since', () => {
    expect(isThreadRead({ role: 'mentor', createdAt: at('10:05') }, at('10:06'))).toBe(true);
  });

  it('is unread when a mentor wrote and the user never opened it', () => {
    expect(isThreadRead({ role: 'mentor', createdAt: at('10:05') }, null)).toBe(false);
  });

  it("never counts the user's own last word", () => {
    expect(isThreadRead({ role: 'user', createdAt: at('10:05') }, null)).toBe(true);
  });

  it('is read when the thread is empty', () => {
    expect(isThreadRead(null, null)).toBe(true);
  });
});
