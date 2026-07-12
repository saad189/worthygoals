import React, { forwardRef, useCallback, useImperativeHandle } from "react";
import {
  StyleSheet,
  Dimensions,
  Pressable,
  StyleProp,
  ImageStyle,
  View,
} from "react-native";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const { width } = Dimensions.get("window");
export interface ImageViewerProps {
  imageUri: string;
  tag: string;
  extraStyles?: StyleProp<ImageStyle>;
  closeOnPress?: boolean;
  onRequestClose?: () => void;
}
export type ImageViewerHandle = {
  resetZoom: () => void;
  resetZoomAndThen: (after: () => void) => void;
};

const ImageViewerModalComponent = forwardRef<
  ImageViewerHandle,
  ImageViewerProps
>(
  (
    {
      imageUri,
      tag,
      extraStyles,
      closeOnPress = true,
      onRequestClose,
    }: ImageViewerProps,
    ref
  ) => {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const scale = useSharedValue(1); // Shared value for scaling
    // Need to improve # Mathematics
    const animateProps = {
      duration: 300, // Adjust duration for smoothness
      easing: Easing.out(Easing.ease), // Use an easing function for a calmer effect
    };

    const maxScale = 2;
    // Gesture handler — reanimated 4 dropped useAnimatedGestureHandler; use the
    // gesture-handler v2 Gesture API instead.
    const pinchHandler = Gesture.Pinch()
      .onUpdate((event) => {
        scale.value = event.scale > maxScale ? maxScale : event.scale;
      })
      .onEnd(() => {
        if (scale.value < 1) scale.value = withTiming(1, animateProps);
      });

    // Animated styles
    // console.log('DATA:', { width, height })

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const resetZoom = useCallback(() => {
      scale.value = withTiming(1, animateProps);
    }, [scale]);

    const resetZoomAndThen = useCallback(
      (after: () => void) => {
        scale.value = withTiming(1, animateProps, (finished) => {
          if (finished) {
            runOnJS(after)();
          }
        });
      },
      [scale]
    );

    useImperativeHandle(
      ref,
      () => ({
        resetZoom,
        resetZoomAndThen,
      }),
      [resetZoom, resetZoomAndThen]
    );

    const requestClose = useCallback(() => {
      const closeFn = onRequestClose ?? navigation.goBack;
      resetZoomAndThen(closeFn);
    }, [navigation.goBack, onRequestClose, resetZoomAndThen]);

    return (
      <GestureHandlerRootView style={{ flex: 1 }} pointerEvents="box-none">
        <View style={styles.container} pointerEvents="box-none">
          {/* ponytail: shared-element transition (sharedTransitionTag) removed —
              reanimated 4 dropped the API with no drop-in replacement; image
              still renders, just without the cross-screen morph. */}
          <GestureDetector gesture={pinchHandler}>
            {closeOnPress ? (
              <Pressable onPress={requestClose}>
                <Animated.Image
                  source={{
                    uri: imageUri,
                  }}
                  style={[
                    extraStyles ? extraStyles : styles.profileImage,
                    animatedStyle,
                  ]}
                />
              </Pressable>
            ) : (
              <Animated.Image
                source={{
                  uri: imageUri,
                }}
                style={[
                  extraStyles ? extraStyles : styles.profileImage,
                  animatedStyle,
                ]}
              />
            )}
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    );
  }
);

export default ImageViewerModalComponent;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  profileImage: {
    width,
    height: width,
    resizeMode: "cover",
  },
});
