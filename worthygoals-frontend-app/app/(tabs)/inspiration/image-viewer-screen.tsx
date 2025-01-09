import React from 'react';
import { useRoute } from '@react-navigation/native';
import ImageViewerModalComponent from '@/components/Common/ImageViewer';
import { Dimensions, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import BorderGradient from '@/components/Common/BorderGradient';

const { width, height } = Dimensions.get('window');

const ImageViewerModal = () => {
    const { params: { imageUri, tag, borderColor } } = useRoute() as any;

    const containerWidth = 0.85 * width;
    const containerHeight = 0.7 * height;
    const borderWidth = 6;
    return (
        <BlurView intensity={15} style={styles.container}>
            <BorderGradient
                borderWidth={borderWidth}
                colors={[borderColor, '#1F1F21']}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 1 }}
                outerStyle={{
                    justifyContent: 'center',
                    width: containerWidth,
                    height: containerHeight,
                }}
            >
                <ImageViewerModalComponent
                    imageUri={imageUri}
                    tag={tag}
                    extraStyles={{
                        width: containerWidth - borderWidth * 2,
                        height: '100%',
                        resizeMode: 'cover',
                        borderRadius: 12
                    }}
                />
            </BorderGradient>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    }
});
export default ImageViewerModal;
