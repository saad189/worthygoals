module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  overrides: [
    {
      // `expect(mock.method)` is the normal way to assert on a jest mock, and
      // unbound-method cannot tell it from an accidental `this` loss. The
      // jest-aware replacement lives in eslint-plugin-jest, which is not a
      // dependency here.
      files: ['**/*.spec.ts'],
      rules: { '@typescript-eslint/unbound-method': 'off' },
    },
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // ── Type-checked rules ────────────────────────────────────────────────
    // parserOptions.project was already configured, so these cost nothing to
    // run and were simply switched off.
    //
    // The full `recommended-requiring-type-checking` set reports 571 problems,
    // 514 of them the no-unsafe-* family — which is the shadow of
    // noImplicitAny: false and no-explicit-any: off (tracker G5), not
    // something to fix by hand under a compiler that cannot see it. So the
    // set is enabled rule by rule: the ones that find real defects today are
    // errors, and the any-driven family waits for G5 to flip the compiler.

    // Surfaces `return x` inside a try whose catch inspects the error — the
    // catch never runs, so the error escapes to the global filter instead
    // (tracker G6).
    '@typescript-eslint/return-await': ['error', 'in-try-catch'],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-base-to-string': 'error',
    '@typescript-eslint/no-unsafe-enum-comparison': 'error',
    '@typescript-eslint/restrict-template-expressions': [
      'error',
      { allowNumber: true, allowBoolean: true, allowNullish: true },
    ],
    '@typescript-eslint/unbound-method': 'error',
    // 22 hits, all harmless async-without-await signatures. Visible, not
    // blocking.
    '@typescript-eslint/require-await': 'warn',
  },
};
