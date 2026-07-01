/**
 * New password — Hi-Fi composition (S45 · P-E): editorial header + warm
 * Field inputs. Confirm-code logic unchanged; native stack header keeps
 * the back affordance.
 */
import React, { useReducer } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { ParamListBase, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';

import { Button, Field, Header, Screen } from '@/components/ui';
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
                repeatedPassword: { ...state.repeatedPassword, error: action.payload.repeatedPasswordError ?? '' },
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
                payload: { codeError, passwordError, repeatedPasswordError },
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
        <Screen scroll edges={['bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Header eyebrow="RESET" title="Pick a new one." />

                    <Field
                        label="Code"
                        returnKeyType="next"
                        value={formState.code.value}
                        onChangeText={(text: string) => dispatch({ type: 'UPDATE_CODE', payload: text })}
                        errorText={formState.code.error}
                        keyboardType="number-pad"
                        description={`If the provided email: ${email} is valid, you will have received the code`}
                    />
                    <Field
                        label="New password"
                        secure
                        value={formState.newPassword.value}
                        onChangeText={(text: string) => dispatch({ type: 'UPDATE_NEW_PASSWORD', payload: text })}
                        errorText={formState.newPassword.error}
                        onSubmitEditing={onSubmitPressed}
                    />
                    <Field
                        label="Repeat new password"
                        secure
                        value={formState.repeatedPassword.value}
                        onChangeText={(text: string) => dispatch({ type: 'UPDATE_REPEATED_PASSWORD', payload: text })}
                        errorText={formState.repeatedPassword.error}
                        onSubmitEditing={onSubmitPressed}
                    />

                    <Button label="Update password" onPress={onSubmitPressed} loading={isLoading} />
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
});
