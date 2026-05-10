import { theme } from '@/core';
import React, { ReactNode } from 'react';
import { ImageBackground, StyleSheet, KeyboardAvoidingView, ViewStyle } from 'react-native';

type Props = {
    children: ReactNode;
    style?: ViewStyle
};

export default function Background({ children, style }: Props) {
    return (
        <ImageBackground
            source={require('@/assets/images/app-background-black.png')}
            resizeMode="cover"
            style={styles.background}
        >
            <KeyboardAvoidingView style={[style ? style : styles.container]} behavior="padding">
                {children}
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        backgroundColor: theme.colors.surface,
    },
    container: {
        flex: 1,
        padding: 20,
        width: '100%',
        maxWidth: 340,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
