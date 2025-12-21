import React, { useCallback, useRef } from "react";
import { useRoute } from "@react-navigation/native";
import ImageViewerModalComponent, {
  ImageViewerHandle,
} from "@/components/Common/ImageViewer";
import Background from "@/components/SubComponents/Background";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "expo-router";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const ImageViewerModal = () => {
  const {
    params: { imageUri, tag },
  } = useRoute() as any;

  const navigation = useNavigation();
  const imageRef = useRef<ImageViewerHandle>(null);
  const goBack = useCallback(() => {
    (navigation as any).goBack();
  }, [navigation]);
  const handleClose = useCallback(() => {
    imageRef.current?.resetZoomAndThen(goBack);
  }, [goBack]);

  return (
    <Background>
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <ImageViewerModalComponent
          ref={imageRef}
          imageUri={imageUri}
          tag={tag}
          onRequestClose={goBack}
        />
      </View>
    </Background>
  );
};

export default ImageViewerModal;
