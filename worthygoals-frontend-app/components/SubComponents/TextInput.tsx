import { theme } from '@/core';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput as Input, TextInputProps } from 'react-native-paper';
const borderRadius = 25;

type Props = TextInputProps & {
    errorText?: string;
    description?: string;
};

export default function TextInput({ errorText, description, ...props }: Props) {
    return (
        <View style={styles.container}>
            <Input
                style={styles.input}
                selectionColor={theme.colors.primary}

                underlineColor="transparent"
                textColor={theme.colors.textWhite}
                theme={{ colors: theme.colors.primary as any, roundness: borderRadius }}
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

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 12,
    },
    input: {
        backgroundColor: theme.colors.primary,
        borderRadius
    },
    description: {
        fontSize: 13,
        color: theme.colors.secondary,
        paddingTop: 8,
    },
    error: {
        fontSize: 13,
        color: theme.colors.error,
        paddingTop: 8,
    },
});
