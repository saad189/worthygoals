import React, { useState, useEffect } from "react";
import { StyleSheet, Dimensions } from "react-native";
import { useAuth } from "@/hooks";
import Background from "@/components/SubComponents/Background";
import { router, useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";

export default function Index() {
  const { checkAuth } = useAuth();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
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
    checkAuth()
      .catch((error) => {
        console.log("Auth check failed:", (error as Error).message);
      })
      .then((result) => {
        if (!result) {
          router.replace("/auth/start-auth");
        }
      });
  }, []);

  // Still needs fixing
  return (
    <Background>
      <></>
    </Background>
  );
}
