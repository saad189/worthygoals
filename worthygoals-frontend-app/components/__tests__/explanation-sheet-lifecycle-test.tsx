/**
 * The seriousness check's Pause and Let it go used to record the miss and
 * close — the goal itself never changed (Oct 17 QA-29). Both now act on it;
 * "push harder" still doesn't.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ExplanationSheet from '../ExplanationSheet';

const renderAtThirdMiss = () => {
  const onSubmit = jest.fn();
  const onGoalAction = jest.fn();
  const onClose = jest.fn();
  render(
    <ExplanationSheet
      personalityId="marcus"
      submitting={false}
      missCountThisWeek={2}
      onSubmit={onSubmit}
      onGoalAction={onGoalAction}
      onClose={onClose}
    />,
  );
  fireEvent.press(screen.getByText("Couldn't"));
  fireEvent.press(screen.getByText("That's the truth"));
  return { onSubmit, onGoalAction, onClose };
};

describe('ExplanationSheet seriousness check', () => {
  it.each([
    ['Pause this goal', 'pause'],
    ['Let it go', 'let_go'],
  ])('%s records the miss and acts on the goal', (label, action) => {
    const { onSubmit, onGoalAction, onClose } = renderAtThirdMiss();
    expect(screen.getByText('3RD MISS THIS WEEK')).toBeTruthy();

    fireEvent.press(screen.getByText(label));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ reason: 'couldnt' }));
    expect(onGoalAction).toHaveBeenCalledWith(action);
    expect(onClose).toHaveBeenCalled();
  });

  it('"Push harder" keeps the goal as it is', () => {
    const { onGoalAction } = renderAtThirdMiss();
    fireEvent.press(screen.getByText('I want it. Push harder.'));
    expect(onGoalAction).not.toHaveBeenCalled();
  });
});
