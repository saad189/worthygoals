import Background from "@/components/SubComponents/Background";
import Button from "@/components/SubComponents/Button";
import Header from "@/components/SubComponents/Header";
import Logo from "@/components/SubComponents/Logo";
import { ROUTE_NAMES } from "@/constants/Routes";
import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "expo-router";

// Logo -> Paragraph -> ImageCard[3] (for now) -> Button
export default function IntroScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();


    const onNext = () => {
        navigation.navigate(ROUTE_NAMES.JOURNEY.self, { screen: ROUTE_NAMES.JOURNEY.SELECT_DISCIPLINE_SCREEN });
    }


    return (
        <Background>
            <Logo isWhite={true} />
            <Header>What are we about?</Header>


            <Button mode="contained" onPress={onNext}>Next</Button>
        </Background>
    );
}