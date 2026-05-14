import { ImageCard } from '@/models';
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ViewStyle, Pressable, StyleProp } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    const { colors } = useAppTheme();

    const handlePress = () => {
        if (isSelectable && onSelect) {
            onSelect(card);
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={!isSelectable}
            style={extraStyles ? extraStyles : [styles.card, { backgroundColor: colors.black }]}
        >
            <Image source={card.imageUrl as any} style={styles.image} />
            <View style={styles.overlay} />
            <Text style={[styles.title, { fontSize, color: colors.textWhite }]}>{card.title}</Text>
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
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    title: {
        alignSelf: 'center',
        top: '75%',
        textTransform: 'uppercase',
        fontWeight: '400',
    },
});

export default ImageCardComponent;
