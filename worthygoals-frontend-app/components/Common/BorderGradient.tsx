import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BorderGradientProps {
    children: React.ReactNode;
    colors: readonly [string, string, ...string[]];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    borderWidth?: number;
    outerStyle?: StyleProp<ViewStyle>;
    innerStyle?: StyleProp<ViewStyle>;
}

const BorderGradient: React.FC<BorderGradientProps> = ({
    children,
    colors,
    start = { x: 1, y: 1 },
    end = { x: 0, y: 1 },
    borderWidth = 5,
    outerStyle,
    innerStyle,
}) => {

    return (
        <LinearGradient
            colors={colors}
            start={start}
            end={end}
            style={[styles.linearGradient, outerStyle]}
        >
            <View style={[styles.innerContainer, { margin: borderWidth }, innerStyle]}>
                {children}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    linearGradient: {
        borderRadius: 12, // Default Outer Border Radius
    },
    innerContainer: {
        flex: 1,
        borderRadius: 12,
        backgroundColor: 'rgb(0,0,0,0.9)',
    },
});

export default BorderGradient;
