import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import IntroScreen from "./journey/1-intro-screen";
import HomeScreen from "./(tabs)/home-screen";
import TabLayout from "./(tabs)/_layout";
import { LoginScreen, StartScreen } from "./auth";
import { useAuth } from "@/hooks";
import Background from "@/components/SubComponents/Background";

export default function Index() {
  const { checkAuth } = useAuth();

  const [_, setIsLandScapeMode] = useState(
    Dimensions.get("window").width >= Dimensions.get("window").height
  );
  useEffect(() => {
    const updateMode = () => {
      const { width, height } = Dimensions.get("window");
      setIsLandScapeMode(width >= height);
    };

    const dimensionListener = Dimensions.addEventListener("change", updateMode);

    return () => {
      dimensionListener.remove();
    };
  }, []);

  useEffect(() => {
    checkAuth().catch((error) => {
      console.log("Auth check failed:", (error as Error).message);
    });
  }, []);

  // Still needs fixing
  return (
    <Background>
      <></>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-evenly",
    backgroundColor: "#f7f9fa",
  },
});
