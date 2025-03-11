import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import Header from '@/components/SubComponents/Header';
import Logo from '@/components/SubComponents/Logo';
import TextInput from '@/components/SubComponents/TextInput';
import { ROUTE_NAMES } from '@/constants/Routes';
import { theme } from '@/core';
import { emailValidator } from '@/helpers';
import { useLoader, useToast } from '@/hooks';
import authService from '@/services/AuthService';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';

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
        <Background>
            {/* <BackButton goBack={navigation.goBack} /> */}
            <Logo isWhite={true} />
            <Header>Restore Password</Header>
            <TextInput
                label="E-mail address"
                returnKeyType="done"
                value={email.value}
                onChangeText={(text: any) => setEmail({ value: text, error: '' })}
                error={!!email.error}
                errorText={email.error}
                autoCapitalize="none"
                textContentType="emailAddress"
                keyboardType="email-address"
                description="You will receive an email with a one-time code for resetting the password."
            />
            <Button mode="contained" onPress={sendResetPasswordEmail} style={styles.button} loading={isLoading}>
                Send Instructions
            </Button>
        </Background>
    );
}
const styles = StyleSheet.create({
    button: {
        width: '100%',
        marginTop: 16
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
