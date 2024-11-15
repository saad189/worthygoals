// Logo -> Paragraph -> Inputs x 5 -> Button


import Background from "@/components/SubComponents/Background";
import Button from "@/components/SubComponents/Button";
import Header from "@/components/SubComponents/Header";
import Logo from "@/components/SubComponents/Logo";
import { ROUTE_NAMES } from "@/constants/Routes";
import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "expo-router";

export default function ProvideInfoScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const onNext = () => {
        navigation.navigate(ROUTE_NAMES.JOURNEY.self, { screen: ROUTE_NAMES.JOURNEY.PROCESSING_SCREEN });
    }

    return (
        <Background>
            <Logo isWhite={true} />
            <Header>Provide Information for us to Craft a Plan for you</Header>


            <Button mode="contained" onPress={onNext}>Next</Button>
        </Background>
    );
}