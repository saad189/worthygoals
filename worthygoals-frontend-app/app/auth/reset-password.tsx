import BackButton from '@/components/SubComponents/BackButton';
import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import Header from '@/components/SubComponents/Header';
import Logo from '@/components/SubComponents/Logo';
import TextInput from '@/components/SubComponents/TextInput';
import { ROUTE_NAMES } from '@/constants/Routes';
import { emailValidator } from '@/helpers';
import React, { useState } from 'react';

type Props = {
    navigation: any;
};

export default function ResetPasswordScreen({ navigation }: Props) {
    const [email, setEmail] = useState<{ value: string; error: string }>({ value: '', error: '' });

    const sendResetPasswordEmail = () => {
        const emailError = emailValidator(email.value);
        if (emailError) {
            setEmail({ ...email, error: emailError });
            return;
        }
        navigation.navigate(ROUTE_NAMES.AUTH.LOGIN);
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
                description="You will receive an email with a password reset link."
            />
            <Button mode="contained" onPress={sendResetPasswordEmail} style={{ marginTop: 16 }}>
                Send Instructions
            </Button>
        </Background>
    );
}
