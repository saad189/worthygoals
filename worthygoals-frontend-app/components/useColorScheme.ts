import { useColorScheme as useSystemScheme } from 'react-native';

// The app follows the system appearance. Every colour reaches components
// through useAppTheme → this hook, so this is the one switch: pin it to
// 'light' (and set userInterfaceStyle back to "light") to force light again.
export function useColorScheme(): 'light' | 'dark' {
  return useSystemScheme() === 'dark' ? 'dark' : 'light';
}
