import { theme } from '@/core';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface LoaderProps {
    progress: number; // Percentage value passed as prop
}
const size = 200;
const strokeWidth = 2;
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;


const LoaderComponent: React.FC<LoaderProps> = ({ progress }) => {
    const spinValue = useRef(new Animated.Value(0)).current;
    let spinAnimation: Animated.CompositeAnimation;
    spinAnimation = Animated.loop(Animated.sequence([
        Animated.timing(spinValue, {
            toValue: 1, // From 0 to 1 in a loop
            duration: 1000, // Duration for one full rotation
            easing: Easing.elastic(0),
            useNativeDriver: true,
        })
    ])
    );

    useEffect(() => {
        if (progress == 0) {
            spinAnimation.start();
        }
        if (progress >= 100) {
            spinValue.stopAnimation();
        }

        return () => {
            // if (spinAnimation) {
            //     spinAnimation.stop();
            // }
        };
    }, [progress]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.loaderContainer}>
            <Animated.View style={[, { transform: [{ rotate: spin }] }]}>
                <Svg width={size} height={size}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="white"
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

const styles = StyleSheet.create({
    loaderContainer: {
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',

        shadowColor: theme.colors.primary,
        shadowOffset: { width: 1, height: -2 }, // Adjust for shadow direction
        shadowOpacity: 0.3, // Shadow transparency
        shadowRadius: 3, // Shadow blur
        elevation: 5, // Adds shadow on Android
        backgroundColor: 'transparent', // Keeps the container invisible
        borderRadius: radius
    },

    progressText: {
        position: 'absolute',
        fontSize: 50,
        color: 'white',
        fontWeight: '500',
    },
});

export default LoaderComponent;
