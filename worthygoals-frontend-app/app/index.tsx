import React, { useState, useEffect, } from 'react';
import { ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import IntroScreen from './journey/1-intro-screen';
import HomeScreen from './(tabs)/home-screen';
import TabLayout from './(tabs)/_layout';
import { LoginScreen } from './auth';

export default function Index() {
    const navigation = useNavigation();
    const [_, setIsLandScapeMode] = useState(Dimensions.get('window').width >= Dimensions.get('window').height);
    useEffect(() => {
        const updateMode = () => {
            const { width, height } = Dimensions.get('window');
            setIsLandScapeMode(width >= height);
        };

        const dimensionListener = Dimensions.addEventListener('change', updateMode);

        return () => {
            dimensionListener.remove();
        };
    }, []);

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps='handled'>
            {/* <IntroScreen /> */}
            <LoginScreen />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-evenly',
        backgroundColor: '#f7f9fa',
    },
});
