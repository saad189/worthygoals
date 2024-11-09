import { theme } from '@/core';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function Header(props: any) {
    return <Text style={styles.header} {...props} />;
}

const styles = StyleSheet.create({
    header: {
        fontSize: 21,
        color: theme.colors.primary,
        fontWeight: 'bold',
        paddingVertical: 12,
    },
});
