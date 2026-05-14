import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TextStyle } from 'react-native';
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '@/hooks/useAppTheme';

const GradientText = ({ text, style }: { text: string; style?: StyleProp<ViewStyle | TextStyle> }) => {
    const { colors } = useAppTheme();
    const fontSize = (style as any)?.fontSize || 12;
    const width = Math.round(3.8 * fontSize + 5 * text.length);

    return (
        <View style={[styles.container, style]}>
            <Svg height={Math.round(fontSize * 1.5)} width={width}>
                <Defs>
                    <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={colors.goalsChatGradientStart} />
                        <Stop offset="100%" stopColor={colors.goalsChatGradientEnd} />
                    </LinearGradient>
                </Defs>
                <SvgText
                    fill="url(#gradient)"
                    fontSize={fontSize}
                    fontWeight="bold"
                    x="0"
                    y="30"
                    textAnchor="start"
                >
                    {text}
                </SvgText>
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default GradientText;
