import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import Background from "@/components/SubComponents/Background";
import Button from "@/components/SubComponents/Button";
import Header from "@/components/SubComponents/Header";
import Logo from "@/components/SubComponents/Logo";
import ChipsList from "@/components/SubComponents/Chips";
import { ROUTE_NAMES } from "@/constants/Routes";
import { SelectGoal } from "@/models";
import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "expo-router";
import ImageCardComponent from '@/components/SubComponents/ImageCard';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SelectionScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const [selectedGoals, setSelectedGoals] = useState<{ [goalId: number]: number[] }>({});
    const [currentGoalIndex, setCurrentGoalIndex] = useState(0);

    const goals: SelectGoal[] = [
        {
            id: 1,
            card: { title: "Knowledge", imageUrl: require('@/assets/images/reading-person.png') },
            tasks: [
                { title: 'Fiction', id: 1 },
                { title: 'Thriller', id: 2 },
                { title: 'Psychology', id: 3 },
                { title: 'History', id: 4 },
            ],
        },
        {
            id: 2,
            card: { title: 'Power', imageUrl: require('@/assets/images/excercise-training.png') },
            tasks: [
                { title: 'Walk', id: 1 },
                { title: 'Run', id: 2 },
                { title: 'Hike', id: 3 },
                { title: 'Powerlift', id: 4 },
                { title: 'Breathe', id: 5 },
            ],
        },
        {
            id: 3,
            card: { title: 'Spirit', imageUrl: require('@/assets/images/motivation-meditation.png') },
            tasks: [
                { title: 'Watch Sunrise', id: 1 },
                { title: 'Meditate', id: 2 },
                { title: 'Gratitude', id: 3 },
                { title: 'Yoga', id: 4 },
            ],
        },
    ];

    const currentGoal = goals[currentGoalIndex];

    // Update the selected IDs for the current goal
    const handleSelectionChange = (selectedIds: number[]) => {
        const currentGoalId = currentGoal.id;
        setSelectedGoals(prev => ({
            ...prev,
            [currentGoalId]: selectedIds,
        }));
    };

    const onNext = () => {
        const currentGoalId = currentGoal.id;

        // Ensure that at least one task is selected before proceeding
        if (!selectedGoals[currentGoalId] || selectedGoals[currentGoalId].length === 0) {
            Alert.alert('Please select at least one task before proceeding.');
            return;
        }

        if (currentGoalIndex < goals.length - 1) {
            setCurrentGoalIndex(prevIndex => prevIndex + 1);
        } else {
            console.log('Selected Goals:', selectedGoals);
            navigation.navigate(ROUTE_NAMES.TABS.self, { screen: ROUTE_NAMES.TABS.HOME_SCREEN });
        }
    };

    return (
        <Background style={styles.container}>
            <View style={{ alignItems: 'center' }}>
                <Logo isWhite={true} />
                <Header>Define Goals</Header>
                <View style={styles.cardContainer}>
                    <ImageCardComponent card={currentGoal.card} />
                </View>
                <View style={styles.chipsContainer}>
                    {goals.map((goal, index) => (
                        <View key={goal.id} style={index === currentGoalIndex ? {} : { display: 'none' }}>
                            <ChipsList
                                chips={currentGoal.tasks}
                                onSelectionChange={handleSelectionChange}
                            />
                        </View>
                    ))}
                </View>
            </View>

            <Button mode="contained" style={styles.button} onPress={onNext}>
                {currentGoalIndex < goals.length - 1 ? "Next" : "Finish"}
            </Button>
        </Background>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    cardContainer: {
        marginVertical: 10,
        alignItems: 'center',
    },
    chipsContainer: {
        marginVertical: 20,
        maxWidth: SCREEN_WIDTH * 0.85,
    },
    button: {
        width: 'auto',
    },
});
