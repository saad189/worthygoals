import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput as Input, TextInputProps } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';

const BORDER_RADIUS = 25;

type Props = TextInputProps & {
    errorText?: string;
    description?: string;
};

export default function TextInput({ errorText, description, ...props }: Props) {
    const { colors } = useAppTheme();
    const styles = useMemo(() => StyleSheet.create({
        container: {
            width: '100%',
            marginVertical: 12,
        },
        input: {
            backgroundColor: colors.primary,
            borderRadius: BORDER_RADIUS,
        },
        description: {
            fontSize: 13,
            color: colors.secondary,
            paddingTop: 8,
        },
        error: {
            fontSize: 13,
            color: colors.dangerColor,
            paddingTop: 8,
        },
    }), [colors]);

    return (
        <View style={styles.container}>
            <Input
                style={styles.input}
                selectionColor={colors.primary}
                underlineColor="transparent"
                textColor={colors.textWhite}
                theme={{ colors: colors.primary as any, roundness: BORDER_RADIUS }}
                mode="flat"
                {...props}
            />
            {description && !errorText ? (
                <Text style={styles.description}>{description}</Text>
            ) : null}
            {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
        </View>
    );
}
