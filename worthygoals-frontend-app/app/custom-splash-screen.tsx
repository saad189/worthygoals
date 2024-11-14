
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View, StyleSheet, Animated, Dimensions, ImageBackground } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { ROUTE_NAMES } from '@/constants/Routes';
import Background from '@/components/SubComponents/Background';
import Logo from '@/components/SubComponents/Logo';
import Header from '@/components/SubComponents/Header';
import Button from '@/components/SubComponents/Button';
import SlidingText from '@/components/SubComponents/SlidingText';
import { theme } from '@/core';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CustomSplashScreen() {
    const slideAnim = new Animated.Value(0);
    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 1,
            duration: 3000, // Adjust for speed of animation
            useNativeDriver: true,
        }).start();
    }, []);

    const textSize = 100;
    const duration = 3000;
    return (
        <Background style={styles.container} >
            <SlidingText duration={duration} textSize={textSize} text="MAX" startPosition={-SCREEN_WIDTH + 100} endPosition={SCREEN_WIDTH} />
            <ImageBackground
                source={require('@/assets/images/glint.png')}
                resizeMode="cover"
                style={styles.background}
            >
                <SlidingText duration={duration} textSize={textSize} text="BELIEF" startPosition={SCREEN_WIDTH} endPosition={-SCREEN_WIDTH} />
                <Logo />
                <SlidingText duration={duration} textSize={textSize} text="PRIME" startPosition={-SCREEN_WIDTH + 100} endPosition={SCREEN_WIDTH} />
            </ImageBackground>
            <SlidingText duration={duration} textSize={textSize} text="LEGEND" startPosition={SCREEN_WIDTH} endPosition={-SCREEN_WIDTH} />
        </Background>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
        //  backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    text: {
        fontSize: 20,
        color: 'black', // Customize for your text
    },
});
