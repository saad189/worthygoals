import React, { useCallback, useRef } from "react";
import { ParamListBase, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

import ImageViewerModalComponent, {
  ImageViewerHandle,
} from "@/components/Common/ImageViewer";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
});

export default function MentorImageViewerScreen() {
  const {
    params: { imageUri, tag },
  } = useRoute() as any;

  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const imageRef = useRef<ImageViewerHandle>(null);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleClose = useCallback(() => {
    imageRef.current?.resetZoomAndThen(goBack);
  }, [goBack]);

  return (
    <View style={styles.container}>
      <BlurView intensity={15} style={StyleSheet.absoluteFill} />
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      <ImageViewerModalComponent
        ref={imageRef}
        imageUri={imageUri}
        tag={tag}
        onRequestClose={goBack}
      />
    </View>
  );
}
