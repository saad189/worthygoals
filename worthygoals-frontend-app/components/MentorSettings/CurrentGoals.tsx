import { GoalItem } from '@/models';
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';

const mockGoals: GoalItem[] = [
    {
        id: 1,
        title: '20 Min Run in the Morning',
        description:
            'Establish a Healthy Early Morning Routine by getting up at 0600 and going for a 20 Min Run.',
        duration: '7 Days Challenge',
        imageUri:
            'https://images.pexels.com/photos/1199590/pexels-photo-1199590.jpeg',
    },
    {
        id: 2,
        title: 'Hike a Mountain',
        description:
            'Go for Nature-based experience/exercise. Hike a nearby mountain once a weekend.',
        duration: '14 Days Challenge',
        imageUri:
            'https://images.pexels.com/photos/733162/pexels-photo-733162.jpeg',
    },
    {
        id: 3,
        title: 'Start to Box',
        description:
            'Establish a Good Athletic Routine by starting some boxing. Start by hitting the bag for 15 min sets daily.',
        duration: '5 Days Challenge',
        imageUri:
            'https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg',
    },
];

const CurrentGoalsComponent: React.FC = () => {
    return (
        <ScrollView style={styles.container}>
            {mockGoals.map((goal) => (
                <TouchableOpacity key={goal.id}>
                    <View style={styles.card} key={goal.id}>
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: goal.imageUri }} style={styles.goalImage} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.durationText}>{goal.duration}</Text>

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
