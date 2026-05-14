import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import Header from '@/components/SubComponents/Header';
import Logo from '@/components/SubComponents/Logo';
import TextInput from '@/components/SubComponents/TextInput';
import { useNavigation } from 'expo-router';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ROUTE_NAMES } from '@/constants';

export default function InformationScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const [formData, setFormData] = useState({
        age: '',
        occupation: '',
        sleepTime: '',
        freeTime: '',
        estimation: '',
    });

    const handleChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const onNext = () => {
        console.log(formData);

        if (true) {
            navigation.navigate(ROUTE_NAMES.JOURNEY.self, { screen: ROUTE_NAMES.JOURNEY.PROCESSING_SCREEN })
        }
    };

    return (
        <Background>
            <View style={styles.logoContainer}>
                <Logo isWhite={true} />
            </View>
            <Header>Provide Information for us to Craft a Plan for you</Header>
            <View style={styles.form}>
                <TextInput
                    label="Age"
                    value={formData.age}
                    onChangeText={(value) => handleChange('age', value)}
                    keyboardType="numeric"
                />
                <TextInput
                    label="Occupation"
                    value={formData.occupation}
                    onChangeText={(value) => handleChange('occupation', value)}
                />
                <TextInput
                    label="Sleep Time"
                    value={formData.sleepTime}
                    onChangeText={(value) => handleChange('sleepTime', value)}
                />
                <TextInput
                    label="Free Time"
                    value={formData.freeTime}
                    onChangeText={(value) => handleChange('freeTime', value)}
                />
                <TextInput
                    label="Est. **"
                    value={formData.estimation}
                    onChangeText={(value) => handleChange('estimation', value)}
                />
            </View>
            <Button mode="contained" onPress={onNext}>
                Next
            </Button>
        </Background>
    );
}

const styles = StyleSheet.create({
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    form: {
        width: '80%',
        alignSelf: 'center',
        marginBottom: 20,
    },
});
