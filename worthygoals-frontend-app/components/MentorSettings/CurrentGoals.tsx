import mapDays from '@/helpers/DayMapper';
import { GoalItem } from '@/models';
import goalService from '@/services/goals.service';
import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

const CurrentGoalsComponent: React.FC = () => {
    const { colors } = useAppTheme();
    const [goalData, setGoalData] = React.useState<GoalItem[]>([]);

    useFocusEffect(
        useCallback(() => {
            goalService.getUserGoals().then((data: GoalItem[]) => {
                const sortedData = data.sort((a, b) => a.durationInDays - b.durationInDays);
                setGoalData(sortedData);
            })
        }, [])
    );

    return (
        <ScrollView style={staticStyles.container}>
            {goalData.map((goal) => (
                <TouchableOpacity key={goal.id}>
                    <View style={[staticStyles.card, { backgroundColor: colors.surfaceGlass }]} key={goal.id}>
                        <View style={staticStyles.imageContainer}>
                            <Image source={{ uri: goal.imageUri }} style={staticStyles.goalImage} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[staticStyles.durationText, { color: colors.durationBadgeText }]}>
                                {mapDays(goal.durationInDays)} Challenge
                            </Text>

                            <Text style={[staticStyles.title, { color: colors.textWhite }]}>{goal.title}</Text>
                            <Text style={[staticStyles.description, { color: colors.textWhite }]}>{goal.description}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

export default CurrentGoalsComponent;

const staticStyles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 5,
    },
    card: {
        borderRadius: 10,
        marginVertical: 8,
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalImage: {
        width: 120,
        height: 100,
        borderRadius: 10,
        resizeMode: 'cover',
    },
    durationText: {
        textAlign: 'center',
        width: '60%',
        padding: 4,
        borderRadius: 12,
        paddingHorizontal: 5,
        backgroundColor: 'rgba(28, 155, 177,0.55)',
        fontWeight: '600',
        fontSize: 12,
    },
    title: {
        fontSize: 13,
        marginVertical: 5,
    },
    description: {
        fontSize: 12,
    },
});
