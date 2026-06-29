import React, { useCallback, useRef } from "react";
import { useRoute } from "@react-navigation/native";
import ImageViewerModalComponent, {
  ImageViewerHandle,
} from "@/components/Common/ImageViewer";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const ImageViewerModal = () => {
  const {
    params: { imageUri, tag },
  } = useRoute() as any;

  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const imageRef = useRef<ImageViewerHandle>(null);
  const goBack = useCallback(() => {
    (navigation as any).goBack();
  }, [navigation]);
  const handleClose = useCallback(() => {
    imageRef.current?.resetZoomAndThen(goBack);
  }, [goBack]);

  // A media viewer wants a dark scrim, not the warm-paper Screen — keep it a
  // solid backdrop so the photo reads, but off the legacy image Background.
  return (
    <View style={[styles.container, { backgroundColor: colors.black }]}>
      <StatusBar style="light" />
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      <ImageViewerModalComponent
        ref={imageRef}
        imageUri={imageUri}
        tag={tag}
        onRequestClose={goBack}
      />
    </View>
  );
};

export default ImageViewerModal;
