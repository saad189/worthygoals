import Background from "@/components/SubComponents/Background";
import Button from "@/components/SubComponents/Button";
import Header from "@/components/SubComponents/Header";
import LoaderComponent from "@/components/SubComponents/Loader";
import Logo from "@/components/SubComponents/Logo";
import Paragraph from "@/components/SubComponents/Paragraph";
import SlidingText from "@/components/SubComponents/SlidingText";
import { ROUTE_NAMES } from "@/constants/Routes";
import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { View, Dimensions, Text, StyleSheet } from 'react-native';
import { useAppTheme } from "@/hooks/useAppTheme";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProcessingScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    const { colors } = useAppTheme();
    const [progress, setProgress] = useState(0);
    const [isProcessingStarted, setIsProcessingStarted] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 1, 100));
        }, 100);

        if (progress === 100) {
            clearInterval(interval);
            setIsProcessingStarted(true);
        }
        return () => clearInterval(interval);
    }, [progress]);

    const onNext = () => {
        navigation.navigate(ROUTE_NAMES.AUTH.START_AUTH);
    };

    const textSize = 50;
    return (
        <Background style={staticStyles.container}>
            <Logo isWhite={true} />
            <Header style={[staticStyles.header, { color: colors.primary }]}>
                You are Almost There
            </Header>
            <LoaderComponent progress={progress} />
            {
                !isProcessingStarted ?
                    <View style={staticStyles.processedContainer}>
                        <Text style={[staticStyles.text, { color: colors.textWhite }]}>Processing</Text>
                        <SlidingText textSize={textSize} text="DISCIPLINE" startPosition={-SCREEN_WIDTH + 100} endPosition={SCREEN_WIDTH} />
                        <SlidingText textSize={textSize} text="ENDURE" startPosition={SCREEN_WIDTH} endPosition={-SCREEN_WIDTH} />
                        <SlidingText textSize={textSize} text="WARRIOR" startPosition={-SCREEN_WIDTH} endPosition={SCREEN_WIDTH} />
                    </View> :
                    <View style={staticStyles.processedContainer}>
                        <Text style={[staticStyles.text, { color: colors.textWhite }]}>Processed</Text>
                        <Text style={[staticStyles.text, { color: colors.textWhite }]}>9:45 PM</Text>
                        <Text style={[staticStyles.text, { color: colors.textWhite }]}>15 November 2024</Text>
                        <Text style={[staticStyles.text, { color: colors.secondary }]}>A Legend is Born</Text>
                        <Button mode="contained" onPress={onNext}>Next</Button>
                    </View>
            }
        </Background>
    );
}

const staticStyles = StyleSheet.create({
    text: {
        fontSize: 25,
    },
    header: {
        fontFamily: 'Outfit',
        fontSize: 33,
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
        alignSelf: 'center',
    },
    processedContainer: {
        width: '100%',
        flex: 0.7,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
});
