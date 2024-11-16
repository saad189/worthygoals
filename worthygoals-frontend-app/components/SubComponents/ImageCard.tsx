import { theme } from '@/core';
import { ImageCard } from '@/models';
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ViewStyle, Pressable, StyleProp } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageCardProps {
    card: ImageCard;
    fontSize?: number;
    extraStyles?: StyleProp<ViewStyle>;
    isSelectable?: boolean;
    onSelect?: (card: ImageCard) => void;
}

const ImageCardComponent: React.FC<ImageCardProps> = ({
    card,
    extraStyles,
    fontSize = 35,
    isSelectable = false,
    onSelect
}) => {
    const handlePress = () => {
        if (isSelectable && onSelect) {
            onSelect(card);
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={!isSelectable}
            style={extraStyles ? extraStyles : styles.card}
        >
            <Image source={card.imageUrl as any} style={styles.image} />
            <View style={styles.overlay} />
            <Text style={[styles.title, { fontSize }]}>{card.title}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        width: SCREEN_WIDTH * 0.85,
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
        // backgroundColor: 'rgba(0, 0, 0, 0.5)', // to darken the image
    },
    title: {
        alignSelf: 'center',
        top: '75%',
        color: theme.colors.textWhite,
        textTransform: 'uppercase',
        fontWeight: '400',
    },
});

export default ImageCardComponent;
