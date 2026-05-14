import Background from "@/components/SubComponents/Background";
import Button from "@/components/SubComponents/Button";
import Header from "@/components/SubComponents/Header";
import ImageCardComponent from "@/components/SubComponents/ImageCard";
import Logo from "@/components/SubComponents/Logo";
import { ROUTE_NAMES } from "@/constants/Routes";
import { ImageCard } from "@/models";
import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "expo-router";
import { Dimensions, StyleSheet } from "react-native";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Logo -> Paragraph -> ImageCard[3] (for now) -> Button
export default function IntroScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const cards: ImageCard[] = [
        {
            title: 'Knowledge',
            imageUrl: require('@/assets/images/reading-books.png')
        },
        {
            title: 'Power',
            imageUrl: require('@/assets/images/excercise-running.png')
        },
        {
            title: 'Spiritual',
            imageUrl: require('@/assets/images/motivation-walking.png')
        },


    ]
    const onNext = () => {
        navigation.navigate(ROUTE_NAMES.JOURNEY.self, { screen: ROUTE_NAMES.JOURNEY.SELECT_DISCIPLINE_SCREEN });
    }


    return (
        <Background>
            <Logo isWhite={true} />
            <Header>What are we about?</Header>

            {
                cards.map((card, index) => (
                    <ImageCardComponent fontSize={20} extraStyles={styles.card} card={card} key={index} />
                ))
            }

            <Button mode="contained" onPress={onNext}>Next</Button>
        </Background>
    );
}

const styles = StyleSheet.create({
    card: {
        width: SCREEN_WIDTH * 0.8,
        borderRadius: 20,
        height: SCREEN_HEIGHT * 0.16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
        marginVertical: 10
    },

});
