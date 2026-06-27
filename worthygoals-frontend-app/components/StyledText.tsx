import { useAppTheme } from '@/hooks/useAppTheme';
import { Text, TextProps } from './Themed';

export function MonoText(props: TextProps) {
  const { fonts } = useAppTheme();
  return <Text {...props} style={[props.style, { fontFamily: fonts.mono }]} />;
}
