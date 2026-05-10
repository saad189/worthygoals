import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Icon } from '@/models';
const styles = (color: string, size: number) => StyleSheet.create({
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: size,
        height: size,
    },
    focusedIconContainer: {
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        backgroundColor: color,
        borderRadius: 8,
    },
});