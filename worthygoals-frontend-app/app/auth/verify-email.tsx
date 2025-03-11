import React, { useReducer } from 'react';
import { StyleSheet, Keyboard } from 'react-native';
import {
    ParamListBase,
    RouteProp,
    useRoute,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';

import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import Header from '@/components/SubComponents/Header';
import Logo from '@/components/SubComponents/Logo';
import TextInput from '@/components/SubComponents/TextInput';
import { useLoader, useToast } from '@/hooks';
import authService from '@/services/AuthService';
import { ROUTE_NAMES } from '@/constants';

type FormState = {
    code: { value: string; error: string };
};

type FormAction =
    | { type: 'UPDATE_CODE'; payload: string }
    | { type: 'SET_ERROR'; payload: string };

const initialState: FormState = {
    code: { value: '', error: '' },
};

function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'UPDATE_CODE':
            return { ...state, code: { value: action.payload, error: '' } };
        case 'SET_ERROR':
            return { ...state, code: { ...state.code, error: action.payload } };
        default:
            return state;
    }
}

export default function VerifyEmailScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const route = useRoute<RouteProp<{ params: { email: string } }, 'params'>>();
    const { email } = route.params;

    const { isLoading, setLoading } = useLoader();
    const { showSuccessMessage, showErrorMessage } = useToast();

    const [formState, dispatch] = useReducer(formReducer, initialState);

    const onSubmitPressed = async () => {
        if (!formState.code.value) {
            dispatch({ type: 'SET_ERROR', payload: 'Code cannot be empty!' });
            return;
        }

        try {
            Keyboard.dismiss();
            setLoading(true);

            await authService.verifyEmail({ email, code: formState.code.value });

            showSuccessMessage('Email Verified!');
            navigation.navigate(ROUTE_NAMES.AUTH.LOGIN);
        } catch (error: any) {
            showErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Background>
            <Logo isWhite />
            <Header>
                Enter Code to Verify Your Email
            </Header>
            <TextInput
                label="Code"
                returnKeyType="done"
                value={formState.code.value}
                onChangeText={(text: string) => dispatch({ type: 'UPDATE_CODE', payload: text })}
                onSubmitEditing={onSubmitPressed}
                error={!!formState.code.error}
                errorText={formState.code.error}
                description={`Please enter the code received on ${email}`}
            />
            <Button
                mode="contained"
                onPress={onSubmitPressed}
                style={styles.button}
                loading={isLoading}
                disabled={isLoading}
            >
                Submit
            </Button>
        </Background>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        marginTop: 24,
    },
    row: {
        flexDirection: 'row',
        marginTop: 4,
    },
});
