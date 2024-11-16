import React, { useState } from 'react';
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
import { Alert, Dimensions, StyleSheet } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DisciplinesScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

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
    ];

    const handleCardSelect = (index: number) => {
        setSelectedIndices((prevSelectedIndices) => {
            const isSelected = prevSelectedIndices.includes(index);
            if (isSelected) {
                return prevSelectedIndices.filter(i => i !== index);
            } else {
                return [...prevSelectedIndices, index];
            }
        });
        console.log('Selected indices:', selectedIndices);
    };

    const onNext = () => {
        if (!selectedIndices || selectedIndices.length === 0) {
            Alert.alert('Please select at least one task before proceeding.');
            return;
        }
        navigation.navigate(ROUTE_NAMES.JOURNEY.self, { screen: ROUTE_NAMES.JOURNEY.PROVIDE_INFO_SCREEN });
    };

    return (
        <Background>
            <Logo isWhite={true} />
            <Header>Select the Disciplines to Evolve Yourself</Header>
            {
                cards.map((card, index) => (
                    <ImageCardComponent
                        fontSize={20}
                        extraStyles={[styles.card, selectedIndices.includes(index) && styles.selectedCard]}
                        card={card}
                        key={index}
                        isSelectable={true}
                        onSelect={() => handleCardSelect(index)}
                    />
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
        marginVertical: 10,
    },
    selectedCard: {
        borderColor: 'yellow',
        borderWidth: 2,
    },
});
