/**
 * The app's first render test.
 *
 * Drilling into a goal mounts CompletionSheet and ExplanationSheet, i.e. two
 * @gorhom/bottom-sheet mounts. On bottom-sheet v4 against reanimated 4 that
 * throws (the lib calls useWorkletCallback / useAnimatedGestureHandler, both
 * removed in reanimated 4), so every goal drill-in crashed the app. Nothing
 * caught it: npm accepted the peer range, `tsc` skipped the lib under
 * skipLibCheck, and no test had ever rendered a screen.
 *
 * The drill-in press matters — rendering the goals list alone does NOT mount
 * the sheets and passes even on the broken version. Verified: with
 * @gorhom/bottom-sheet@4.6.4 installed this test fails.
 *
 * Keep this test rendering a real screen. Its value is not the assertion, it is
 * that a native-module or New Architecture break in the render path fails CI
 * instead of shipping.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import TodoListScreen from '../todo-list-screen';

jest.mock('expo-router', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }),
}));

// The data layer is not under test here — the render path is.
const GOAL = { id: 'g1', title: 'Run a half marathon', status: 'active', mentorId: null };

jest.mock('@/hooks/useGoals', () => ({
  useGoals: () => ({ goals: [GOAL], loading: false, error: null, refetch: jest.fn() }),
}));
jest.mock('@/hooks/useMentors', () => ({ useMentors: () => ({ mentors: [] }) }));
jest.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
    optimisticUpdateStatus: jest.fn(),
  }),
}));
jest.mock('@/hooks/useCompleteTask', () => ({
  useCompleteTask: () => ({
    complete: jest.fn(),
    submitting: false,
    mentorReaction: null,
    safetyFlag: false,
    clearReaction: jest.fn(),
  }),
}));
jest.mock('@/hooks/useExplainTask', () => ({
  useExplainTask: () => ({
    explain: jest.fn(),
    submitting: false,
    mentorReaction: null,
    safetyFlag: false,
    clearReaction: jest.fn(),
  }),
}));

describe('TodoListScreen', () => {
  it('renders the goals list', () => {
    render(<TodoListScreen />);
    expect(screen.getByText(GOAL.title)).toBeTruthy();
  });

  it('drills into a goal without throwing, mounting both bottom sheets', () => {
    render(<TodoListScreen />);

    expect(() =>
      fireEvent.press(screen.getByLabelText(`Open goal ${GOAL.title}`)),
    ).not.toThrow();

    // Back affordance only exists in the drilled-in view, which is the branch
    // that mounts CompletionSheet and ExplanationSheet.
    expect(screen.getByLabelText('Back to goals')).toBeTruthy();
  });
});
