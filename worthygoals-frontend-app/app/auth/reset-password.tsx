/**
 * Reset password — Hi-Fi composition (S45 · P-E): editorial header + warm
 * Field input. Reset-code logic unchanged; native stack header keeps the
 * back affordance.
 */
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';

import { Button, Field, Header, Screen } from '@/components/ui';
import { ROUTE_NAMES } from '@/constants/Routes';
import { emailValidator } from '@/helpers';
import { useLoader, useToast } from '@/hooks';
import authService from '@/services/AuthService';

export default function ResetPasswordScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const [email, setEmail] = useState<{ value: string; error: string }>({ value: '', error: '' });
    const { isLoading, setLoading } = useLoader();
    const { showInfoMessage, showErrorMessage } = useToast();

    const sendResetPasswordEmail = async () => {
        const emailError = emailValidator(email.value);
        if (emailError) {
            setEmail({ ...email, error: emailError });
            return;
        }

        try {
            Keyboard.dismiss();
            setLoading(true);

            await authService.sendForgotPasswordCode(email.value);

            showInfoMessage(`Reset Password Code Sent to ${email.value}`);

            navigation.navigate(ROUTE_NAMES.AUTH.NEW_PASSWORD_SCREEN, { email: email.value });
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
                    <Header eyebrow="RESET" title="Forgot it? It happens." />

                    <Field
                        label="Email"
                        returnKeyType="done"
                        value={email.value}
                        onChangeText={(text: string) => setEmail({ value: text, error: '' })}
                        errorText={email.error}
                        autoCapitalize="none"
                        textContentType="emailAddress"
                        keyboardType="email-address"
                        description="You will receive an email with a one-time code for resetting the password."
                    />

                    <Button label="Send instructions" onPress={sendResetPasswordEmail} loading={isLoading} />
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
});
