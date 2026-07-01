/**
 * Verify email — Hi-Fi composition (S45 · P-E): editorial header + warm
 * Field input. Verification logic unchanged; native stack header keeps
 * the back affordance.
 */
import React, { useReducer } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
    ParamListBase,
    RouteProp,
    useRoute,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';

import { Button, Field, Header, Screen } from '@/components/ui';
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
        <Screen scroll edges={['bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Header eyebrow="ONE-TIME CODE" title="Check your inbox." />

                    <Field
                        label="Code"
                        returnKeyType="done"
                        value={formState.code.value}
                        onChangeText={(text: string) => dispatch({ type: 'UPDATE_CODE', payload: text })}
                        onSubmitEditing={onSubmitPressed}
                        errorText={formState.code.error}
                        keyboardType="number-pad"
                        description={`Please enter the code received on ${email}`}
                    />

                    <Button
                        label="Verify"
                        onPress={onSubmitPressed}
                        loading={isLoading}
                        disabled={isLoading}
                    />
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
});
