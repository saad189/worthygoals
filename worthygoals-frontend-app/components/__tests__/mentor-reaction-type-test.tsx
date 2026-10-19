/**
 * Oct 17 QA: the completion / explanation reactions drew every mentor in
 * serif italic (the `display` headline). Each mentor reacts in their own type,
 * the way the feed's StatusReactionCard already did.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import CompletionSheet from '../CompletionSheet';
import ExplanationSheet from '../ExplanationSheet';
import { FontFamily } from '@/constants/tokens';

const LINE = 'Logged. Same time tomorrow.';
const noop = () => {};

const styleOf = () => StyleSheet.flatten(screen.getByText(LINE).props.style);

describe.each([
  ['CompletionSheet', CompletionSheet],
  ['ExplanationSheet', ExplanationSheet],
] as const)('%s reaction', (_, Sheet) => {
  const renderFor = (personalityId: string) =>
    render(
      <Sheet
        personalityId={personalityId}
        submitting={false}
        mentorReaction={LINE}
        onSubmit={noop}
        onClose={noop}
      />,
    );

  it('Marcus reacts in sans', () => {
    renderFor('marcus');
    expect(styleOf()).toMatchObject({ fontFamily: FontFamily.sans });
    expect(styleOf().fontStyle).toBeUndefined();
  });

  it('Lyra reacts in serif italic', () => {
    renderFor('lyra');
    expect(styleOf()).toMatchObject({ fontFamily: FontFamily.serifItalic, fontStyle: 'italic' });
  });

  it('Goggs reacts in mono uppercase', () => {
    renderFor('goggs');
    expect(styleOf()).toMatchObject({ fontFamily: FontFamily.mono, textTransform: 'uppercase' });
  });
});
