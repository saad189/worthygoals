/**
 * Create account — Hi-Fi composition (S45 · P-E): editorial header + warm
 * Field inputs replace the legacy dark form. Sign-up + verify redirect
 * logic unchanged.
 */
import React, { useReducer } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Keyboard } from 'react-native';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';

import { Button, Field, Header, Screen } from '@/components/ui';
import { APP_NAME } from '@/constants/Brand';
import { ROUTE_NAMES } from '@/constants/Routes';
import { emailValidator, passwordValidator, repeatPasswordValidator } from '@/helpers';
import { useLoader, useToast } from '@/hooks';
import authService from '@/services/AuthService';

type FormState = {
    email: { value: string; error: string };
    password: { value: string; error: string };
    repeatedPassword: { value: string; error: string };
};

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
                email: { ...state.email, error: action.payload.emailError ?? '' },
                password: { ...state.password, error: action.payload.passwordError ?? '' },
                repeatedPassword: { ...state.repeatedPassword, error: action.payload.repeatedPasswordError ?? '' },
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
                payload: { emailError, passwordError, repeatedPasswordError },
            });
            return;
        }

        try {
            Keyboard.dismiss();
            setLoading(true);

            const { email, password, repeatedPassword } = formState;

            const isSignUpSuccessful = await authService.signupUser({
                email: email.value,
                password: password.value,
                repeatedPassword: repeatedPassword.value,
            });
            if (isSignUpSuccessful) {
                showSuccessMessage('Account created! Please Verify your email');
                navigation.navigate(ROUTE_NAMES.AUTH.self, {
                    screen: ROUTE_NAMES.AUTH.VERIFY_EMAIL_SCREEN,
                    params: { email: email.value },
                });
            }
        } catch (error: any) {
            showErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen scroll>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Header eyebrow={`${APP_NAME} · NEW`} title="Let's get you set up." />

                    <Field
                        label="Email"
                        returnKeyType="next"
                        value={formState.email.value}
                        onChangeText={(text: string) => dispatch({ type: 'UPDATE_EMAIL', payload: text })}
                        errorText={formState.email.error}
                        autoCapitalize="none"
                        textContentType="emailAddress"
                        keyboardType="email-address"
                    />
                    <Field
                        label="Password"
                        secure
                        value={formState.password.value}
                        onChangeText={(text: string) => dispatch({ type: 'UPDATE_PASSWORD', payload: text })}
                        errorText={formState.password.error}
                        onSubmitEditing={onSignUpPressed}
                    />
                    <Field
                        label="Repeat password"
                        secure
                        value={formState.repeatedPassword.value}
                        onChangeText={(text: string) => dispatch({ type: 'UPDATE_REPEAT_PASSWORD', payload: text })}
                        errorText={formState.repeatedPassword.error}
                        onSubmitEditing={onSignUpPressed}
                    />

                    <Button label="Create account" onPress={onSignUpPressed} loading={isLoading} />
                    <Button
                        label="Already have an account? Sign in"
                        variant="link"
                        onPress={() => navigation.replace(ROUTE_NAMES.AUTH.LOGIN)}
                    />
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
});
