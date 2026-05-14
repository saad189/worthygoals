import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface AnimatedTextProps {
  text: string;
  textSize?: number;
  startPosition: number;
  endPosition: number;
  duration?: number;
}

const SlidingText: React.FC<AnimatedTextProps> = ({
  text,
  textSize = 50,
  startPosition,
  endPosition,
  duration = 10000,
}) => {
  const { colors } = useAppTheme();
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
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [translateX, startPosition, endPosition, duration]);

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      <Text style={[staticStyles.animatedText, { fontSize: textSize, color: colors.textInactive }]}>
        {text}
      </Text>
    </Animated.View>
  );
};

const staticStyles = StyleSheet.create({
  animatedText: {
    fontFamily: "Poppins-ExtraBold",
    fontWeight: "900",
    textAlign: "center",
  },
});

export default SlidingText;
