import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import Header from '@/components/SubComponents/Header';
import Logo from '@/components/SubComponents/Logo';
import PasswordField from '@/components/SubComponents/PasswordField';
import TextInput from '@/components/SubComponents/TextInput';
import { ROUTE_NAMES } from '@/constants/Routes';
import { theme } from '@/core';
import { emailValidator, passwordValidator, repeatPasswordValidator } from '@/helpers';
import { useLoader, useToast } from '@/hooks';
import authService from '@/services/AuthService';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';
import React, { useReducer } from 'react';
import { View, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { Text } from 'react-native-paper';

type FormState = {
    email: { value: string; error: string };
    password: { value: string; error: string };
    repeatedPassword: { value: string; error: string };
};

// export const TYPES = {
//     UPDATE_NAME: 'UPDATE_NAME',
//     UPDATE_EMAIL: 'UPDATE_EMAIL',
//     UPDATE_PASSWORD: 'UPDATE_PASSWORD',
//     UPDATE_REPEAT_PASS: 'UPDATE_REPEAT_PASS'
// }

type FormAction =

    | { type: 'UPDATE_EMAIL'; payload: string }
    | { type: 'UPDATE_PASSWORD'; payload: string }
    | { type: 'UPDATE_REPEAT_PASSWORD'; payload: string }
    | {
        type: 'SET_ERRORS';
        payload: {

            emailError?: string;
            passwordError?: string;
            repeatedPasswordError?: string;
        };
    };

const initialState: FormState = {

    email: { value: '', error: '' },
    password: { value: '', error: '' },
    repeatedPassword: { value: '', error: '' }
};

function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {

        case 'UPDATE_EMAIL':
            return { ...state, email: { value: action.payload, error: '' } };
        case 'UPDATE_PASSWORD':
            return { ...state, password: { value: action.payload, error: '' } };
        case 'UPDATE_REPEAT_PASSWORD':
            return { ...state, repeatedPassword: { value: action.payload, error: '' } };
        case 'SET_ERRORS':
            return {
                ...state,
                email: {
                    ...state.email,
                    error: action.payload.emailError ?? '',
                },
                password: {
                    ...state.password,
                    error: action.payload.passwordError ?? '',
                },
                repeatedPassword: {
                    ...state.repeatedPassword,
                    error: action.payload.repeatedPasswordError ?? '',
                },
            };
        default:
            return state;
    }
}

export default function RegisterScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    const { isLoading, setLoading } = useLoader();
    const { showSuccessMessage, showErrorMessage } = useToast();

    const [formState, dispatch] = useReducer(formReducer, initialState);

    const onSignUpPressed = async () => {
        const emailError = emailValidator(formState.email.value);
        const passwordError = passwordValidator(formState.password.value);
        const repeatedPasswordError = repeatPasswordValidator(formState.password.value, formState.repeatedPassword.value);

        if (emailError || passwordError || repeatedPasswordError) {
            dispatch({
                type: 'SET_ERRORS',
                payload: {
                    emailError,
                    passwordError,
                    repeatedPasswordError
                },
            });
            return;
        }

        try {
            Keyboard.dismiss();
            setLoading(true);

            const { email, password, repeatedPassword } = formState;

            const isSignUpSuccessful = await authService.signupUser({ email: email.value, password: password.value, repeatedPassword: repeatedPassword.value });
            if (isSignUpSuccessful) {
                showSuccessMessage('Account created! Please Verify your email');
                navigation.navigate(ROUTE_NAMES.AUTH.self, { screen: ROUTE_NAMES.AUTH.VERIFY_EMAIL_SCREEN, params: { email: email.value } })
            }
        } catch (error: any) {
            showErrorMessage(error.message);
        } finally {
            setLoading(false);
        }


    };

    return (
        <Background>
            {/* <BackButton goBack={navigation.goBack} /> */}
            <Logo isWhite={true} />
            <Header>Create Account</Header>
            <TextInput
                label="Email"
                returnKeyType="next"
                value={formState.email.value}
                onChangeText={(text: string) =>
                    dispatch({ type: 'UPDATE_EMAIL', payload: text })
                }
                error={!!formState.email.error}
                errorText={formState.email.error}
                autoCapitalize="none"
                textContentType="emailAddress"
                keyboardType="email-address"
            />
            <PasswordField
                placeholder="Password"
                value={formState.password.value}
                onChangeText={(text: string) =>
                    dispatch({ type: 'UPDATE_PASSWORD', payload: text })
                }
                errorText={formState.password.error}
                onSubmitEditing={onSignUpPressed}
            />

            <PasswordField
                placeholder="Repeat Password"
                value={formState.repeatedPassword.value}
                onChangeText={(text: string) =>
                    dispatch({ type: 'UPDATE_REPEAT_PASSWORD', payload: text })
                }
                errorText={formState.repeatedPassword.error}
                onSubmitEditing={onSignUpPressed}
            />
            <Button mode="contained" onPress={onSignUpPressed} style={styles.button} loading={isLoading}>
                Sign Up
            </Button>
            <View style={styles.row}>
                <TouchableOpacity onPress={() => navigation.replace(ROUTE_NAMES.AUTH.LOGIN)}>
                    <Text style={{ color: theme.colors.primary }}>
                        Already have an account?
                        <Text style={styles.link}> Login</Text>
                    </Text>
                </TouchableOpacity>
            </View>
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
    link: {
        fontWeight: 'bold',
        color: theme.colors.secondary,
    },
});
