/**
 * Guards ECC-7 M1: "Yes" then "Not today" inside the 200 ms modal fade used to
 * schedule both timers, open both sheets and race complete() against explain()
 * on the same task. First answer wins now.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import TodoListScreen from '../todo-list-screen';

const mockOpenComplete = jest.fn();
const mockOpenExplain = jest.fn();

jest.mock('@/components/CompletionSheet', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: R.forwardRef((_p: unknown, ref: any) => {
      R.useImperativeHandle(ref, () => ({ open: mockOpenComplete, close: jest.fn() }));
      return null;
    }),
  };
});
jest.mock('@/components/ExplanationSheet', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: R.forwardRef((_p: unknown, ref: any) => {
      R.useImperativeHandle(ref, () => ({ open: mockOpenExplain, close: jest.fn() }));
      return null;
    }),
  };
});
// Capture the modal's handlers so both answers can land in one act() — i.e.
// before the modal's hide has rendered, which is the real race.
const mockAsk: { onYes?: () => void; onNotToday?: () => void } = {};
jest.mock('@/components/DidYouDoIt', () => ({
  __esModule: true,
  default: (p: any) => {
    if (p.visible) Object.assign(mockAsk, { onYes: p.onYes, onNotToday: p.onNotToday });
    return null;
  },
}));
jest.mock('expo-router', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }),
}));

const mockGoal = { id: 'g1', title: 'Run', status: 'active', mentorId: null };
const mockTask = { id: 't1', title: '5k run', status: 'pending', updatedAt: new Date().toISOString() };

jest.mock('@/hooks/useGoals', () => ({
  useGoals: () => ({ goals: [mockGoal], loading: false, error: null, refetch: jest.fn() }),
}));
jest.mock('@/hooks/useMentors', () => ({ useMentors: () => ({ mentors: [] }) }));
jest.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: [mockTask],
    loading: false,
    error: null,
    refetch: jest.fn(),
    optimisticUpdateStatus: jest.fn(),
  }),
}));
const mockHook = () => ({
  complete: jest.fn(),
  explain: jest.fn(),
  submitting: false,
  mentorReaction: null,
  safetyFlag: false,
  clearReaction: jest.fn(),
});
jest.mock('@/hooks/useCompleteTask', () => ({ useCompleteTask: () => mockHook() }));
jest.mock('@/hooks/useExplainTask', () => ({ useExplainTask: () => mockHook() }));

describe('Did you do it? — answer race', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('opens only the sheet for the first answer', () => {
    render(<TodoListScreen />);
    fireEvent.press(screen.getByLabelText(`Open goal ${mockGoal.title}`));
    fireEvent.press(screen.getByLabelText(`Answer for ${mockTask.title}`));

    act(() => {
      mockAsk.onYes?.();
      mockAsk.onNotToday?.();
    });
    act(() => {
      jest.runAllTimers();
    });

    expect(mockOpenComplete).toHaveBeenCalledTimes(1);
    expect(mockOpenExplain).not.toHaveBeenCalled();
  });
});
