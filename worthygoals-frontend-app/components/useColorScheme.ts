// V1 is warm-light only. Dark mode is V1.5 (see ui-frontend-rearchitecture-plan
// §E-3): the dark palette exists but is unfinished, so following the OS scheme
// renders a half-built dark theme. Pin to 'light' until dark is intentionally
// completed; this is the single switch to flip when that happens.
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
