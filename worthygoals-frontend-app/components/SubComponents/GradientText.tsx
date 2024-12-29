import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TextStyle } from 'react-native';
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const GradientText = ({ text, style }: { text: string; style?: StyleProp<ViewStyle | TextStyle> }) => {

    const fontSize = style?.fontSize || 12;
    return (
        <View style={[styles.container, style]}>
            <Svg height={Math.round(fontSize * 1.5)} width={Math.round((text.length + 1) * fontSize / 2)}>
                <Defs>
                    <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#FF5F6D" />
                        <Stop offset="100%" stopColor="#FFC371" />
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

        // backgroundColor: '#20232a',
    },
});

export default GradientText;
