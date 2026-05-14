import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Button as PaperButton, ButtonProps as PaperButtonProps } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
    mode: 'text' | 'outlined' | 'contained';
    style?: ViewStyle;
} & Omit<PaperButtonProps, 'mode'>;

export default function Button({ mode, style, ...props }: Props) {
    const { colors } = useAppTheme();
    return (
        <PaperButton
            style={[
                staticStyles.button,
                { backgroundColor: mode === 'outlined' ? colors.surface : colors.buttonTheme },
                style,
            ]}
            labelStyle={staticStyles.text}
            mode={mode}
            {...props}
        />
    );
}

const staticStyles = StyleSheet.create({
    button: {
        width: 'auto',
        borderRadius: 30,
        marginVertical: 10,
    },
    text: {
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 20,
    },
});
