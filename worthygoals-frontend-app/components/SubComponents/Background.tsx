import React, { ReactNode } from 'react';
import { ImageBackground, StyleSheet, KeyboardAvoidingView, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
    children: ReactNode;
    style?: ViewStyle;
};

export default function Background({ children, style }: Props) {
    const { colors } = useAppTheme();
    return (
        <ImageBackground
            source={require('@/assets/images/app-background-black.png')}
            resizeMode="cover"
            style={[styles.background, { backgroundColor: colors.surface }]}
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
