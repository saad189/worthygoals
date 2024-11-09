import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import Logo from '@/components/SubComponents/Logo';
import { ROUTE_NAMES } from '@/constants/Routes';
import React from 'react';
import { Paragraph } from 'react-native-paper';
import { Header } from 'react-native/Libraries/NewAppScreen';


type Props = {
    navigation: any;
};

export default function StartScreen({ navigation }: Props) {
    return (
        <Background>
            <Logo />
            <Header>Login Template</Header>
            <Paragraph>
                The easiest way to start with your amazing application.
            </Paragraph>
            <Button
                mode="contained"
                onPress={() => navigation.navigate(ROUTE_NAMES.AUTH.LOGIN)}
            >
                Login
            </Button>
            <Button
                mode="outlined"
                onPress={() => navigation.navigate(ROUTE_NAMES.AUTH.REGISTER)}
            >
                Sign Up
            </Button>
        </Background>
    );
}
