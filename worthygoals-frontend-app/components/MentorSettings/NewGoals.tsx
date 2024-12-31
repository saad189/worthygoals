import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

import { GoalCategory, GoalCategoryEnum, GoalItem } from '@/models';
import { capitalizeFirstLetter, getEnumValues, getImageUri } from '@/helpers';
import goalService from '@/services/goals.service';

const categoryOptions = getEnumValues(GoalCategoryEnum);
const emptyGoal: GoalItem = {
    title: '',
    id: 0,
    description: '',
    durationInDays: 0,
    imageUri: '',
    category: 'Power',
    creationDate: new Date()
};

const NewGoalsComponent: React.FC = () => {
    const [goal, setGoal] = useState<GoalItem>(emptyGoal);

    const [value, setValue] = useState<any>([]);
    const [items, setItems] = useState(
        categoryOptions.map(option => ({ label: capitalizeFirstLetter(option), value: (option) })));

    const setGoalTitle = (title: string) => setGoal(prev => ({ ...prev, title }));
    const setGoalDescription = (description: string) => setGoal(prev => ({ ...prev, description }));
    const setGoalDuration = (durationInDays: string) => setGoal(prev => ({ ...prev, durationInDays: Number(durationInDays) }));

    const [open, setOpen] = useState(false);

    const handleSaveGoal = () => {
        if (!goal)
            return;

        if (!goal.title || !goal.description || !goal.durationInDays) {
            Alert.alert('Missing Fields', 'Please fill all fields to continue.');
            return;
        }
        // Save logic goes here, e.g. POST to an API or local state
        goalService.saveGoal({ ...goal, imageUri: getImageUri(goal.category), category: value });
        Alert.alert('Goal Saved!', `${goal.title} has been added.`);
        setGoal(emptyGoal);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <View style={styles.container}>
                <Text style={styles.label}>Goal Title</Text>
                <TextInput
                    style={styles.input}
                    value={goal.title}
                    placeholderTextColor="#aaa"
                    placeholder="Enter Goal Title"
                    onChangeText={setGoalTitle}
                />

                <Text style={styles.label}>Category</Text>
                <DropDownPicker
                    open={open}
                    value={value}
                    items={items}
                    setOpen={setOpen}
                    setValue={setValue}
                    setItems={setItems}
                    theme="LIGHT"
                    multiple={false}
                    mode="BADGE"
                    placeholder='Choose a Category'
                    style={[styles.input, { marginBottom: 20 }]}
                />

                <Text style={styles.label}>Goal Description</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={goal.description}
                    placeholderTextColor="#aaa"
                    placeholder="Enter Goal Description"
                    onChangeText={setGoalDescription}
                    multiline
                />

                <Text style={styles.label}>Goal Duration (in Days)</Text>
                <TextInput
                    style={styles.input}
                    value={goal.durationInDays.toString()}
                    placeholderTextColor="#aaa"
                    placeholder="Enter Goal Duration"
                    inputMode='numeric'
                    onChangeText={setGoalDuration}
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveGoal}>
                    <Text style={styles.saveButtonText}>Save Goal</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default NewGoalsComponent;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        paddingHorizontal: 10,
        height: 40,
        fontSize: 14,
        color: '#000',
    },
    multilineInput: {
        height: 60,
        paddingVertical: 5,
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
        fontSize: 14,
        fontWeight: '600',
    },
});
