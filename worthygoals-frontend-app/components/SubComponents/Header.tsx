import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function Header(props: any) {
    const { colors } = useAppTheme();
    return <Text style={[styles.header, { color: colors.primary }]} {...props} />;
}

const styles = StyleSheet.create({
    header: {
        fontFamily: 'Outfit',
        fontSize: 33,
        fontWeight: '400',
        paddingVertical: 12,
        textAlign: 'center',
    },
});
