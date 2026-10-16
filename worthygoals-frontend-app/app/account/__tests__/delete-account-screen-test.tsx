/**
 * In-app account deletion (App Store 5.1.1(v)). Guards the confirm gate, that
 * success hands off to the account-deleted sign-out, and that a failure
 * keeps the user here with the error shown.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import userService from '@/services/UserService';
import DeleteAccountScreen from '../delete-account-screen';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@/services/UserService', () => ({
  __esModule: true,
  default: { deleteAccount: jest.fn() },
}));
const mockLogout = jest.fn().mockResolvedValue(undefined);
jest.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ logout: mockLogout }) }));

const mockDelete = userService.deleteAccount as jest.Mock;

const typeConfirm = (text: string) =>
  fireEvent.changeText(screen.getByLabelText('Type "delete" to confirm'), text);
const pressDelete = () =>
  act(async () => {
    fireEvent.press(screen.getByLabelText('Delete my account'));
  });

describe('DeleteAccountScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does nothing until "delete" is typed', async () => {
    render(<DeleteAccountScreen />);
    typeConfirm('delet');
    await pressDelete();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('deletes, then signs out as account-deleted', async () => {
    mockDelete.mockResolvedValue(undefined);
    render(<DeleteAccountScreen />);
    typeConfirm(' Delete ');
    await pressDelete();
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledWith({ accountDeleted: true });
  });

  it('stays signed in and shows the error when deletion fails', async () => {
    mockDelete.mockRejectedValue(new Error('Server unavailable'));
    render(<DeleteAccountScreen />);
    typeConfirm('delete');
    await pressDelete();
    expect(mockLogout).not.toHaveBeenCalled();
    expect(screen.getByText('Server unavailable')).toBeTruthy();
  });
});
