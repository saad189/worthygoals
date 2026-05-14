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
import { useAppTheme } from '@/hooks/useAppTheme';

const categoryOptions = getEnumValues(GoalCategoryEnum);
const emptyGoal: GoalItem = {
    title: '',
    id: '',
    description: '',
    durationInDays: 0,
    imageUri: '',
    category: 'Power',
    creationDate: new Date()
};

const NewGoalsComponent: React.FC = () => {
    const { colors } = useAppTheme();
    const [goal, setGoal] = useState<GoalItem>(emptyGoal);

    const [value, setValue] = useState<any>([]);
    const [items, setItems] = useState(
        categoryOptions.map(option => ({ label: capitalizeFirstLetter(option), value: (option) })));

    const setGoalTitle = (title: string) => setGoal(prev => ({ ...prev, title }));
    const setGoalDescription = (description: string) => setGoal(prev => ({ ...prev, description }));
    const setGoalDuration = (durationInDays: string) => setGoal(prev => ({ ...prev, durationInDays: Number(durationInDays) }));

    const [open, setOpen] = useState(false);

    const handleSaveGoal = () => {
        if (!goal) return;

        if (!goal.title || !goal.description || !goal.durationInDays) {
            Alert.alert('Missing Fields', 'Please fill all fields to continue.');
            return;
        }

        goalService.saveGoal({ ...goal, imageUri: getImageUri(goal.category), category: value, id: `m-${Date.now()}`, });
        Alert.alert('Goal Saved!', `${goal.title} has been added.`);
        setGoal(emptyGoal);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <View style={staticStyles.container}>
                <Text style={[staticStyles.label, { color: colors.textWhite }]}>Goal Title</Text>
                <TextInput
                    style={[staticStyles.input, { backgroundColor: colors.white, color: colors.black }]}
                    value={goal.title}
                    placeholderTextColor={colors.textMuted}
                    placeholder="Enter Goal Title"
                    onChangeText={setGoalTitle}
                />

                <Text style={[staticStyles.label, { color: colors.textWhite }]}>Category</Text>
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
                    style={[staticStyles.input, { marginBottom: 20, backgroundColor: colors.white }]}
                />

                <Text style={[staticStyles.label, { color: colors.textWhite }]}>Goal Description</Text>
                <TextInput
                    style={[staticStyles.input, staticStyles.multilineInput, { backgroundColor: colors.white, color: colors.black }]}
                    value={goal.description}
                    placeholderTextColor={colors.textMuted}
                    placeholder="Enter Goal Description"
                    onChangeText={setGoalDescription}
                    multiline
                />

                <Text style={[staticStyles.label, { color: colors.textWhite }]}>Goal Duration (in Days)</Text>
                <TextInput
                    style={[staticStyles.input, { backgroundColor: colors.white, color: colors.black }]}
                    value={goal.durationInDays.toString()}
                    placeholderTextColor={colors.textMuted}
                    placeholder="Enter Goal Duration"
                    inputMode='numeric'
                    onChangeText={setGoalDuration}
                />

                <TouchableOpacity
                    style={[staticStyles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSaveGoal}
                >
                    <Text style={[staticStyles.saveButtonText, { color: colors.textWhite }]}>Save Goal</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default NewGoalsComponent;

const staticStyles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        borderRadius: 8,
        marginBottom: 10,
        paddingHorizontal: 10,
        height: 40,
        fontSize: 14,
    },
    multilineInput: {
        height: 60,
        paddingVertical: 5,
        textAlignVertical: 'top',
    },
    saveButton: {
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
