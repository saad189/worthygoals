// Logo -> Paragraph -> Loader with Status -> Paragraph(White) -> SlidingText x3
// ... Replace Sliding Text with -> Time to Complete -> Text -> Button

import Background from "@/components/SubComponents/Background";
import Button from "@/components/SubComponents/Button";
import Header from "@/components/SubComponents/Header";
import Logo from "@/components/SubComponents/Logo";
import SlidingText from "@/components/SubComponents/SlidingText";
import { ROUTE_NAMES } from "@/constants/Routes";
import { theme } from "@/core";
import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "expo-router";
import { useState } from "react";
import { Dimensions, Text } from "react-native";

// Get screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Logo -> Paragraph -> ImageCard[3] (for now) -> Button
export default function ProcessingScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const [isProcessingStarted, setIsProcessingStarted] = useState(false);

    const onNext = () => {
        if (!isProcessingStarted) {
            setIsProcessingStarted(true);
        } else
            navigation.navigate(ROUTE_NAMES.AUTH.START_AUTH);
    }

    return (
        <Background>
            <Logo isWhite={true} />
            <Header>You are Almost There</Header>

            <Text>Processing Circle</Text>

            {
                !isProcessingStarted ? <>
                    <Text>Processing</Text>
                    <SlidingText text="ONE" startPosition={-SCREEN_WIDTH + 100} endPosition={SCREEN_WIDTH} />
                    <SlidingText text="ENDURE" startPosition={SCREEN_WIDTH} endPosition={-SCREEN_WIDTH} />
                    <SlidingText text="LEGACY" startPosition={-SCREEN_WIDTH} endPosition={SCREEN_WIDTH} />
                </> :
                    <>
                        <Text>Processed</Text>
                        <Text>9:45 PM</Text>
                        <Text>15 November 2024</Text>
                        <Text style={{ color: theme.colors.secondary }}>A Legend is Born</Text>
                    </>
            }
            <Button mode="contained" onPress={onNext}>Next</Button>
        </Background>
    );
}