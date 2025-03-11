import React from 'react';
import { ParamListBase, useRoute } from '@react-navigation/native';
import ImageViewerModalComponent from '@/components/Common/ImageViewer';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import BorderGradient from '@/components/Common/BorderGradient';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';

const { width, height } = Dimensions.get('window');

const ImageViewerModal = () => {
    const { params: { imageUri, tag, borderColor } } = useRoute() as any;

    const containerWidth = 0.9 * width;
    const containerHeight = 0.7 * height;
    const borderWidth = 5;
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    return (
        <Pressable style={styles.container} onPress={navigation.goBack}>
            <BlurView intensity={15} style={styles.container}>
                <BorderGradient
                    borderWidth={borderWidth}
                    colors={[borderColor, borderColor, '#1F1F21',]}
                    start={{ x: 1, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    outerStyle={{
                        marginTop: 90,
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
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    }
});
export default ImageViewerModal;
