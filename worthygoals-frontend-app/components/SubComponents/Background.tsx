import React, { ReactNode } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
    children: ReactNode;
    style?: ViewStyle;
};

/**
 * Legacy full-bleed wrapper, kept for the screens still assembled around its
 * centred KeyboardAvoidingView layout (auth flow, splash, mentor-detail,
 * todo detail/edit, goal-selection). Historically it painted a dark
 * `app-background-black.png` regardless of theme — which is why those screens
 * stayed dark after the warm-light pin (U0). It now renders the warm-paper
 * background token so every screen built on it reads on-brand. New screens
 * should prefer the `ui/Screen` primitive (safe-area aware); this stays only
 * to avoid re-laying-out the remaining form screens.
 */
export default function Background({ children, style }: Props) {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.background, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView style={[style ? style : styles.container]} behavior="padding">
                {children}
            </KeyboardAvoidingView>
        </View>
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
