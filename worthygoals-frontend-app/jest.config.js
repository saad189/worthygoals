// Was inline in package.json; moved here so the transformIgnorePatterns
// allowlist can be derived from jest-expo's own rather than pasted as a copy
// that silently rots when the preset changes.
const preset = require('jest-expo/jest-preset.js');

// moti (and @motify) ship untranspiled ESM. Screen tests reach them through the
// bottom sheets, so they must be transformed.
const ESM_PACKAGES = ['moti', '@motify'];

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: preset.transformIgnorePatterns.map((p) =>
    p.startsWith('/node_modules/(?!(')
      ? p.replace('))', `|${ESM_PACKAGES.join('|')}))`)
      : p,
  ),
};
