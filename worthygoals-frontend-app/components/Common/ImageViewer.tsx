import React from 'react';
import { StyleSheet, Dimensions, Pressable, StyleProp, ImageStyle } from 'react-native';
import { ParamListBase, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
    Easing,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { PinchGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
export interface ImageViewerProps {
    imageUri: string;
    tag: string;
    extraStyles?: StyleProp<ImageStyle>;
}
const ImageViewerModalComponent = ({ imageUri, tag, extraStyles }: ImageViewerProps) => {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const scale = useSharedValue(1); // Shared value for scaling
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);
    // Need to improve # Mathematics
    const animateProps = {
        duration: 300, // Adjust duration for smoothness
        easing: Easing.out(Easing.ease), // Use an easing function for a calmer effect
    };

    const maxScale = 2;
    // Gesture handler
    const pinchHandler = useAnimatedGestureHandler({
        onActive: (event: any) => {
            scale.value = event.scale > maxScale ? maxScale : event.scale;
            // focalX.value = width / 2;
            // focalY.value = height / 2;
            // console.log({ focalX: focalX.value, focalY: focalY.value, scale: scale.value, ycalc: scale.value * focalY.value })
        },
        onEnd: () => {
            if (scale.value < 1) scale.value = withTiming(1, animateProps);
        }
    });

    // Animated styles
    // console.log('DATA:', { width, height })

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
        ],
    }));
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Pressable onPress={navigation.goBack} style={styles.container}>
                <PinchGestureHandler onGestureEvent={pinchHandler}>
                    <Animated.Image
                        source={{
                            uri: imageUri,
                        }}
                        sharedTransitionTag={tag}
                        style={[extraStyles ? extraStyles : styles.profileImage, animatedStyle]}
                    />
                </PinchGestureHandler>
            </Pressable>
        </GestureHandlerRootView>
    );
};

export default ImageViewerModalComponent;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    profileImage: {
        width,
        height: width,
        resizeMode: 'cover',
    },
});
