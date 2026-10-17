/**
 * The wizard's last step pre-selects a mentor. "Set a goal with Goggs" used to
 * land on Marcus: the mentor was never passed through, and the fallback read
 * an onboarding value that is empty after a sign-in on a fresh install.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react-native';

import TodoPersonalityScreen from '../todo-personality-screen';

let mockParams: Record<string, string | undefined> = {};
let mockProfileSlug: string | null = null;

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ mentorSlug: mockProfileSlug }),
}));
jest.mock('@/hooks/useMentors', () => ({
  useMentors: () => ({ resolveMentorId: jest.fn() }),
}));
jest.mock('@/hooks/useCreateGoal', () => ({
  useCreateGoal: () => ({ createGoal: jest.fn(), saving: false }),
}));

const selectedName = () =>
  within(screen.getByRole('button', { selected: true })).getByText(/^(Marcus|Lyra|Goggs)$/)
    .props.children;

describe('TodoPersonalityScreen pre-selection', () => {
  beforeEach(() => {
    mockParams = { goalData: JSON.stringify({ title: 'Run' }) };
    mockProfileSlug = null;
  });

  it('selects the mentor the goal was started from', () => {
    mockParams.mentor = 'goggs';
    mockProfileSlug = 'lyra';
    render(<TodoPersonalityScreen />);
    expect(selectedName()).toBe('Goggs');
  });

  it("falls back to the user's own mentor from the profile", () => {
    mockProfileSlug = 'lyra';
    render(<TodoPersonalityScreen />);
    expect(selectedName()).toBe('Lyra');
  });

  it('ignores an unknown mentor param and falls back to Marcus', () => {
    mockParams.mentor = 'not-a-mentor';
    render(<TodoPersonalityScreen />);
    expect(selectedName()).toBe('Marcus');
  });
});
