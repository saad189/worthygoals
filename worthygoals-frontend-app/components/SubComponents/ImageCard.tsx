import { theme } from '@/core';
import { ImageCard } from '@/models';
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ImageCardComponent: React.FC<any> = ({ card }: { card: ImageCard }) => {

    return (
        <View style={styles.card}>
            <Image source={card.imageUrl as any} style={styles.image} />
            <View style={styles.overlay} />
            <Text style={styles.title}>{card.title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: SCREEN_WIDTH * 0.8,
        minHeight: 200,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        //   backgroundColor: 'rgba(0, 0, 0, 0.5)', // to darken the image
    },
    title: {
        alignSelf: 'center',
        top: '75%',
        color: theme.colors.textWhite,
        fontSize: 35,
        textTransform: 'uppercase',
        fontWeight: '400',
    },
});

export default ImageCardComponent;
