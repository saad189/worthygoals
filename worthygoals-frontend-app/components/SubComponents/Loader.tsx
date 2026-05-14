import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '@/hooks/useAppTheme';

interface LoaderProps {
    progress: number;
}

const size = 200;
const strokeWidth = 2;
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;

const LoaderComponent: React.FC<LoaderProps> = ({ progress }) => {
    const { colors } = useAppTheme();
    const spinValue = useRef(new Animated.Value(0)).current;
    let spinAnimation: Animated.CompositeAnimation;
    spinAnimation = Animated.loop(Animated.sequence([
        Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.elastic(0),
            useNativeDriver: true,
        })
    ]));

    useEffect(() => {
        if (progress == 0) {
            spinAnimation.start();
        }
        if (progress >= 100) {
            spinValue.stopAnimation();
        }

        return () => {
            // spinAnimation.stop();
        };
    }, [progress]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const styles = useMemo(() => StyleSheet.create({
        loaderContainer: {
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 1, height: -2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 5,
            backgroundColor: 'transparent',
            borderRadius: radius,
        },
        progressText: {
            position: 'absolute',
            fontSize: 50,
            color: colors.textWhite,
            fontWeight: '500',
        },
    }), [colors]);

    return (
        <View style={styles.loaderContainer}>
            <Animated.View style={[, { transform: [{ rotate: spin }] }]}>
                <Svg width={size} height={size}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={colors.textWhite}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference * (progress < 100 ? 0.75 : 1)}, ${circumference}`}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </Svg>
            </Animated.View>
            <Text style={styles.progressText}>{Math.min(progress, 100)}%</Text>
        </View>
    );
};

export default LoaderComponent;
