import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";

interface AnimatedTextProps {
  text: string;
  textSize?: number;
  startPosition: number;
  endPosition: number;
  duration?: number; // Animation duration in ms
}

const SlidingText: React.FC<AnimatedTextProps> = ({
  text,
  textSize = 50,
  startPosition,
  endPosition,
  duration = 10000,
}) => {
  const translateX = useRef(new Animated.Value(startPosition)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: endPosition,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startPosition,
          duration: 0, // Reset to start immediately
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop(); // Cleanup on unmount
  }, [translateX, startPosition, endPosition, duration]);

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      <Text style={[styles.animatedText, { fontSize: textSize }]}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E", // Dark background
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", // Prevent text from going out of bounds visually
  },
  animatedText: {
    fontFamily: "Poppins-ExtraBold",
    color: "#555", // Faint text color
    fontWeight: "900",
    textAlign: "center",
  },
});

export default SlidingText;
