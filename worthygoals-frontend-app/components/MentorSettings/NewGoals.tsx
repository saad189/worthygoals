import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';

const NewGoalsComponent: React.FC = () => {
    const [goal, setGoal] = useState({
        title: '',
        description: '',
        duration: ''
    });

    const setGoalTitle = (title: string) => setGoal(prev => ({ ...prev, title }));
    const setGoalDescription = (description: string) => setGoal(prev => ({ ...prev, description }));
    const setGoalDuration = (duration: string) => setGoal(prev => ({ ...prev, duration }));

    const handleSaveGoal = () => {
        if (!goal.title || !goal.description || !goal.duration) {
            Alert.alert('Missing Fields', 'Please fill all fields to continue.');
            return;
        }
        // Save logic goes here, e.g. POST to an API or local state
        Alert.alert('Goal Saved!', `${goal.title} has been added.`);
        setGoal({
            title: '',
            description: '',
            duration: ''
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Set a New Goal</Text>

            <TextInput
                style={styles.input}
                value={goal.title}
                placeholderTextColor="#aaa"
                placeholder="Enter Goal Title"
                onChangeText={setGoalTitle}
            />

            <TextInput
                style={[styles.input, styles.multilineInput]}
                value={goal.description}
                placeholderTextColor="#aaa"
                placeholder="Enter Goal Description"
                onChangeText={setGoalDescription}
                multiline
            />

            <TextInput
                style={styles.input}
                value={goal.duration}
                placeholderTextColor="#aaa"
                placeholder="Enter Goal Duration"
                onChangeText={setGoalDuration}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveGoal}>
                <Text style={styles.saveButtonText}>Save Goal</Text>
            </TouchableOpacity>
        </View>
    );
};

export default NewGoalsComponent;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'flex-start',
    },
    header: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
        color: '#fff',
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 10,
        height: 50,
        fontSize: 16,
        color: '#000',
    },
    multilineInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#E65581',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
