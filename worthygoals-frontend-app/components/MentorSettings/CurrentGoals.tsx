import mapDays from '@/helpers/DayMapper';
import { GoalItem } from '@/models';
import goalService from '@/services/goals.service';
import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';

const CurrentGoalsComponent: React.FC = () => {

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
        <ScrollView style={styles.container}>
            {goalData.map((goal) => (
                <TouchableOpacity key={goal.id}>
                    <View style={styles.card} key={goal.id}>
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: goal.imageUri }} style={styles.goalImage} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.durationText}>{mapDays(goal.durationInDays)} Challenge</Text>

                            <Text style={styles.title}>{goal.title}</Text>
                            <Text style={styles.description}>{goal.description}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))
            }
        </ScrollView >
    );
};

export default CurrentGoalsComponent;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 5,
    },
    card: {
        backgroundColor: 'rgba(217, 217, 217,0.1)',
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
        color: '#00D3FF',
        backgroundColor: 'rgba(28, 155, 177,0.55)',
        fontWeight: '600',
        fontSize: 12,
    },
    title: {
        fontSize: 13,
        marginVertical: 5,
        color: 'white',
    },
    description: {
        fontSize: 12,
        color: 'white',
    },
});
