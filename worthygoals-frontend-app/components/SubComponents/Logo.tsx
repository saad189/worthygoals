import React from 'react';
import { Image, StyleSheet } from 'react-native';

export default function Logo({ isWhite }: { isWhite?: boolean }) {
    const location = isWhite
        ? require('@/assets/images/evolve-logo-white.png')
        : require('@/assets/images/evolve-logo.png');


    return <Image source={location} style={styles.image} />;
}

const styles = StyleSheet.create({
    image: {
        width: 150,
        height: 150,
        marginBottom: 8,
    },
});
