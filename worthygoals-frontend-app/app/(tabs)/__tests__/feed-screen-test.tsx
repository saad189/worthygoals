/**
 * The status feed became a paginated FlatList (it was an unbounded
 * posts.map inside a ScrollView). Guards the render path and that reaching
 * the end asks for the next page.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import FeedScreen from '../feed-screen';

jest.mock('expo-router', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));
jest.mock('@/hooks/useMentors', () => ({ useMentors: () => ({ mentors: [] }) }));
jest.mock('@/services/conversations.service', () => ({}));

const mockLoadMore = jest.fn();
let mockPosts: unknown[] = [];
jest.mock('@/hooks/useStatusFeed', () => ({
  useStatusFeed: () => ({
    posts: mockPosts,
    loading: false,
    error: null,
    refetch: jest.fn(),
    refreshing: false,
    loadMore: mockLoadMore,
    loadingMore: false,
  }),
}));

const post = (id: string, text: string) => ({
  id,
  text,
  createdAt: '2026-09-30T11:14:00.000Z',
  reactions: [{ personalityId: 'marcus', mentorName: 'Marcus', text: 'Run before bed.' }],
});

describe('FeedScreen', () => {
  beforeEach(() => mockLoadMore.mockClear());

  it('shows the empty state with no posts', () => {
    mockPosts = [];
    render(<FeedScreen />);
    expect(screen.getByText('Tell the team something.')).toBeTruthy();
  });

  it('renders posts with their mentor replies', () => {
    mockPosts = [post('p1', 'wrote 500 words')];
    render(<FeedScreen />);
    expect(screen.getByText('“wrote 500 words”')).toBeTruthy();
    expect(screen.getByText('Run before bed.')).toBeTruthy();
  });

  it('asks for the next page at the end of the list', () => {
    mockPosts = [post('p1', 'a')];
    render(<FeedScreen />);
    fireEvent(screen.getByTestId('status-feed'), 'onEndReached');
    expect(mockLoadMore).toHaveBeenCalled();
  });
});
