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

let mockParams: { goalId?: string; taskId?: string } = {};
const mockSetParams = jest.fn();
jest.mock('expo-router', () => ({
  router: { setParams: (p: unknown) => mockSetParams(p) },
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }),
}));

// DidYouDoIt is a native Modal with its own SafeAreaProvider, which renders
// nothing under jest; stand in a marker for "the answer moment is open".
jest.mock('@/components/DidYouDoIt', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: (p: { visible: boolean; taskTitle?: string }) =>
      p.visible ? <Text>{`Did you do it: ${p.taskTitle}`}</Text> : null,
  };
});

// The data layer is not under test here — the render path is.
const GOAL = { id: 'g1', title: 'Run a half marathon', status: 'active', mentorId: null };

jest.mock('@/hooks/useGoals', () => ({
  useGoals: () => ({ goals: [GOAL], loading: false, error: null, refetch: jest.fn() }),
}));
jest.mock('@/hooks/useMentors', () => ({ useMentors: () => ({ mentors: [] }) }));
const TASK = { id: 't1', goalId: 'g1', title: 'Run 5k', status: 'pending', updatedAt: '2026-10-19' };
let mockTasks: unknown[] = [];
jest.mock('@/hooks/useTasks', () => ({
  useTasks: (goalId: string | null) => ({
    tasks: goalId ? mockTasks : [],
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
  beforeEach(() => {
    mockParams = {};
    mockTasks = [];
    mockSetParams.mockClear();
  });

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

  // Oct 17 QA: tapping a task on the today screen only opened the goals tab.
  it('opens the answer moment for the task the today screen links to', () => {
    mockParams = { goalId: GOAL.id, taskId: TASK.id };
    mockTasks = [TASK];
    render(<TodoListScreen />);

    expect(screen.getByLabelText('Back to goals')).toBeTruthy();
    expect(screen.getByText(`Did you do it: ${TASK.title}`)).toBeTruthy();
    expect(mockSetParams).toHaveBeenCalledWith({ goalId: undefined, taskId: undefined });
  });

  it('does not open the answer moment without a linked task', () => {
    mockTasks = [TASK];
    render(<TodoListScreen />);
    fireEvent.press(screen.getByLabelText(`Open goal ${GOAL.title}`));
    expect(screen.queryByText(`Did you do it: ${TASK.title}`)).toBeNull();
  });
});
