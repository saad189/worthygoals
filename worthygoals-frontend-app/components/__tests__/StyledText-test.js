import * as React from 'react';
import { render } from '@testing-library/react-native';

import { MonoText } from '../StyledText';

// react-test-renderer is deprecated under React 19 (renders null); use RNTL,
// which the rest of the suite already relies on.
it(`renders correctly`, () => {
  const { toJSON } = render(<MonoText>Snapshot test!</MonoText>);
  expect(toJSON()).toMatchSnapshot();
});
