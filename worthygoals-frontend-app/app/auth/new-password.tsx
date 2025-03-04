import React, { useReducer } from 'react';
import { StyleSheet, Keyboard } from 'react-native';
import { ParamListBase, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';

import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import Header from '@/components/SubComponents/Header';
import Logo from '@/components/SubComponents/Logo';
import TextInput from '@/components/SubComponents/TextInput';
import PasswordField from '@/components/SubComponents/PasswordField';
import { theme } from '@/core';
import { passwordValidator, repeatPasswordValidator } from '@/helpers';
import { useLoader, useToast } from '@/hooks';
import authService from '@/services/AuthService';
import { ROUTE_NAMES } from '@/constants';

type FormState = {
    code: { value: string; error: string };
    newPassword: { value: string; error: string };
    repeatedPassword: { value: string; error: string };
};

type FormAction =
    | { type: 'UPDATE_CODE'; payload: string }
    | { type: 'UPDATE_NEW_PASSWORD'; payload: string }
    | { type: 'UPDATE_REPEATED_PASSWORD'; payload: string }
    | {
        type: 'SET_ERRORS';
        payload: {
            codeError?: string;
            passwordError?: string;
            repeatedPasswordError?: string;
        };
    };

const initialState: FormState = {
    code: { value: '', error: '' },
    newPassword: { value: '', error: '' },
    repeatedPassword: { value: '', error: '' },
};

function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'UPDATE_CODE':
            return { ...state, code: { value: action.payload, error: '' } };
        case 'UPDATE_NEW_PASSWORD':
            return { ...state, newPassword: { value: action.payload, error: '' } };
        case 'UPDATE_REPEATED_PASSWORD':
            return { ...state, repeatedPassword: { value: action.payload, error: '' } };
        case 'SET_ERRORS':
            return {
                ...state,
                code: { ...state.code, error: action.payload.codeError ?? '' },
                newPassword: { ...state.newPassword, error: action.payload.passwordError ?? '' },
                repeatedPassword: {
                    ...state.repeatedPassword,
                    error: action.payload.repeatedPasswordError ?? '',
                },
            };
        default:
            return state;
    }
}

export default function NewPasswordScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    const route = useRoute<RouteProp<{ params: { email: string } }, 'params'>>();
    const { email } = route.params;

    const { isLoading, setLoading } = useLoader();
    const { showSuccessMessage, showErrorMessage } = useToast();

    const [formState, dispatch] = useReducer(formReducer, initialState);

    const onSubmitPressed = async () => {

        const codeError = !formState.code.value ? 'Code cannot be empty!' : '';
        const passwordError = passwordValidator(formState.newPassword.value);
        const repeatedPasswordError = repeatPasswordValidator(
            formState.newPassword.value,
            formState.repeatedPassword.value
        );

        if (codeError || passwordError || repeatedPasswordError) {
            dispatch({
                type: 'SET_ERRORS',
                payload: {
                    codeError,
                    passwordError,
                    repeatedPasswordError,
                },
            });
            return;
        }

        try {
            Keyboard.dismiss();
            setLoading(true);

            const isPasswordResetSuccessful = await authService.confirmNewPassword({
                email,
                code: formState.code.value,
                password: formState.newPassword.value,
                repeatedPassword: formState.repeatedPassword.value,
            });

            if (isPasswordResetSuccessful) {
                showSuccessMessage('Password updated successfully!');
                navigation.navigate(ROUTE_NAMES.AUTH.LOGIN);
            }
        } catch (error: any) {
            showErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Background>
            <Logo isWhite={true} />
            <Header>Reset Password</Header>

            <TextInput
                label="Code"
                returnKeyType="done"
                value={formState.code.value}
                onChangeText={(text: string) => dispatch({ type: 'UPDATE_CODE', payload: text })}
                error={!!formState.code.error}
                errorText={formState.code.error}
                description={`If the provided email: ${email} is valid, you will have received the code`}
            />

            <PasswordField
                placeholder="New Password"
                value={formState.newPassword.value}
                onChangeText={(text: string) => dispatch({ type: 'UPDATE_NEW_PASSWORD', payload: text })}
                errorText={formState.newPassword.error}
                onSubmitEditing={onSubmitPressed}
            />

            <PasswordField
                placeholder="Repeat New Password"
                value={formState.repeatedPassword.value}
                onChangeText={(text: string) =>
                    dispatch({ type: 'UPDATE_REPEATED_PASSWORD', payload: text })
                }
                errorText={formState.repeatedPassword.error}
                onSubmitEditing={onSubmitPressed}
            />

            <Button
                mode="contained"
                onPress={onSubmitPressed}
                style={styles.button}
                loading={isLoading}
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
    link: {
        fontWeight: 'bold',
        color: theme.colors.secondary,
    },
});
