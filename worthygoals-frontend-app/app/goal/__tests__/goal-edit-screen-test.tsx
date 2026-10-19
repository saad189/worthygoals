/**
 * Goals and tasks had no edit or delete anywhere in the app. Guards the save
 * path for both kinds and that an empty name is caught before the request.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { goalsApiService } from '@/services/goals.service';
import { tasksService } from '@/services/tasks.service';
import GoalEditScreen from '../goal-edit-screen';

let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/hooks/useGoals', () => ({
  useGoals: () => ({ goals: [{ id: 'g1', title: 'Run a 5k', description: '' }] }),
}));
jest.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({ tasks: [{ id: 't1', goalId: 'g1', title: 'Run 5k today' }] }),
}));
jest.mock('@/services/goals.service', () => ({
  goalsApiService: { update: jest.fn().mockResolvedValue({}), remove: jest.fn() },
}));
jest.mock('@/services/tasks.service', () => ({
  tasksService: { update: jest.fn().mockResolvedValue({}), remove: jest.fn() },
}));
jest.mock('@/core/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn().mockResolvedValue(undefined) },
}));

const press = (label: string) =>
  act(async () => {
    fireEvent.press(screen.getByText(label));
  });

describe('GoalEditScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('saves a smaller task and goes back', async () => {
    mockParams = { kind: 'task', id: 't1', goalId: 'g1' };
    render(<GoalEditScreen />);
    fireEvent.changeText(screen.getByDisplayValue('Run 5k today'), '  Walk 1k today ');
    await press('Save');

    expect(tasksService.update).toHaveBeenCalledWith('t1', {
      title: 'Walk 1k today',
      description: '',
    });
    expect(router.back).toHaveBeenCalled();
  });

  it('renames a goal', async () => {
    mockParams = { kind: 'goal', id: 'g1' };
    render(<GoalEditScreen />);
    fireEvent.changeText(screen.getByDisplayValue('Run a 5k'), 'Run a 10k');
    await press('Save');

    expect(goalsApiService.update).toHaveBeenCalledWith('g1', {
      title: 'Run a 10k',
      description: '',
    });
  });

  it('refuses an empty name without calling the API', async () => {
    mockParams = { kind: 'goal', id: 'g1' };
    render(<GoalEditScreen />);
    fireEvent.changeText(screen.getByDisplayValue('Run a 5k'), '   ');
    await press('Save');

    expect(goalsApiService.update).not.toHaveBeenCalled();
    expect(screen.getByText('Give it a name.')).toBeTruthy();
  });
});
