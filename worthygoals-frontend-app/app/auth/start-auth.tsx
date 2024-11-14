import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import Header from '@/components/SubComponents/Header';
import Logo from '@/components/SubComponents/Logo';
import SlidingText from '@/components/SubComponents/SlidingText';
import { ROUTE_NAMES } from '@/constants/Routes';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
type Props = {
    navigation: any;
};

export default function StartScreen({ navigation }: Props) {
    return (
        <Background style={styles.container} >

            <Logo isWhite={true} />
            <Header>Evolve Membership</Header>
            <Button
                mode="contained"
                onPress={() => navigation.navigate(ROUTE_NAMES.AUTH.LOGIN)}
            >
                Login
            </Button>
            <Button
                mode="contained"
                onPress={() => navigation.navigate(ROUTE_NAMES.AUTH.REGISTER)}
            >
                Sign Up
            </Button>
            <SlidingText text="ONE" startPosition={-SCREEN_WIDTH + 100} endPosition={SCREEN_WIDTH} />
            <SlidingText text="ENDURE" startPosition={SCREEN_WIDTH} endPosition={-SCREEN_WIDTH} />
            <SlidingText text="LEGACY" startPosition={-SCREEN_WIDTH} endPosition={SCREEN_WIDTH} />
        </Background>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        width: '100%',
        maxWidth: 340,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'space-around',
    }
})