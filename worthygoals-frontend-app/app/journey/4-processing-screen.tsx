// Logo -> Paragraph -> Loader with Status -> Paragraph(White) -> SlidingText x3
// ... Replace Sliding Text with -> Time to Complete -> Text -> Button

import Background from "@/components/SubComponents/Background";
import Button from "@/components/SubComponents/Button";
import Header from "@/components/SubComponents/Header";
import LoaderComponent from "@/components/SubComponents/Loader";
import Logo from "@/components/SubComponents/Logo";
import Paragraph from "@/components/SubComponents/Paragraph";
import SlidingText from "@/components/SubComponents/SlidingText";
import { ROUTE_NAMES } from "@/constants/Routes";
import { theme } from "@/core";
import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { View, Dimensions, Text, StyleSheet, Animated, Easing } from 'react-native';
// Get screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Logo -> Paragraph -> ImageCard[3] (for now) -> Button
export default function ProcessingScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    const [progress, setProgress] = useState(0);
    const [isProcessingStarted, setIsProcessingStarted] = useState(false);
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 1, 100)); // Increase progress by 5 every second
        }, 100);

        if (progress === 100) {
            clearInterval(interval); // Stop updating progress when it reaches 100
            setIsProcessingStarted(true);
        }
        return () => clearInterval(interval);
    }, [progress]);
    const onNext = () => {
        navigation.navigate(ROUTE_NAMES.AUTH.START_AUTH);
    }

    const textSize = 50;
    return (
        <Background style={styles.container} >
            <Logo isWhite={true} />
            <Header style={styles.header}>You are Almost There</Header>
            <LoaderComponent progress={progress} />
            {
                !isProcessingStarted ?
                    <View style={styles.processedContainer}>
                        <Text style={styles.text}>Processing</Text>
                        <SlidingText textSize={textSize} text="DISCIPLINE" startPosition={-SCREEN_WIDTH + 100} endPosition={SCREEN_WIDTH} />
                        <SlidingText textSize={textSize} text="ENDURE" startPosition={SCREEN_WIDTH} endPosition={-SCREEN_WIDTH} />
                        <SlidingText textSize={textSize} text="WARRIOR" startPosition={-SCREEN_WIDTH} endPosition={SCREEN_WIDTH} />
                    </View> :
                    <View style={styles.processedContainer}>
                        <Text style={styles.text}>Processed</Text>
                        <Text style={styles.text}>9:45 PM</Text>
                        <Text style={styles.text}>15 November 2024</Text>
                        <Text style={[styles.text, { color: theme.colors.secondary }]}>A Legend is Born</Text>
                        <Button mode="contained" onPress={onNext}>Next</Button>
                    </View>
            }
        </Background >
    );
}

const styles = StyleSheet.create({
    text: {
        color: theme.colors.textWhite,
        fontSize: 25,
    },
    header: {
        fontFamily: 'Outfit',
        fontSize: 33,
        color: theme.colors.primary,
        fontWeight: '500',
        width: '100%',
        display: 'flex',
        textAlign: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        maxWidth: '80%',
        alignSelf: 'center'
    },
    processedContainer: {
        width: '100%',
        flex: 0.7,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center'
    },

});
