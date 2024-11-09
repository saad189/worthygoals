import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { emailValidator, passwordValidator } from '@/helpers';
import BackButton from '@/components/SubComponents/BackButton';
import Background from '@/components/SubComponents/Background';
import Logo from '@/components/SubComponents/Logo';
import { Header } from 'react-native/Libraries/NewAppScreen';
import TextInput from '@/components/SubComponents/TextInput';
import Button from '@/components/SubComponents/Button';
import { theme } from '@/core';
import { ROUTE_NAMES } from '@/constants/Routes';


type Props = {
    navigation: any;
};

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState<{ value: string; error: string }>({ value: '', error: '' });
    const [password, setPassword] = useState<{ value: string; error: string }>({ value: '', error: '' });

    const onLoginPressed = () => {
        const emailError = emailValidator(email.value);
        const passwordError = passwordValidator(password.value);
        if (emailError || passwordError) {
            setEmail({ ...email, error: emailError });
            setPassword({ ...password, error: passwordError });
            return;
        }
        navigation.reset({
            index: 0,
            routes: [{ name: ROUTE_NAMES.TABS.HOME_SCREEN }],
        });
    };

    return (
        <Background>
            <BackButton goBack={navigation.goBack} />
            <Logo />
            <Header>Welcome back.</Header>
            <TextInput
                label="Email"
                returnKeyType="next"
                value={email.value}
                onChangeText={(text: any) => setEmail({ value: text, error: '' })}
                error={!!email.error}
                errorText={email.error}
                autoCapitalize="none"
                textContentType="emailAddress"
                keyboardType="email-address"
            />
            <TextInput
                label="Password"
                returnKeyType="done"
                value={password.value}
                onChangeText={(text: any) => setPassword({ value: text, error: '' })}
                error={!!password.error}
                errorText={password.error}
                secureTextEntry
            />
            <View style={styles.forgotPassword}>
                <TouchableOpacity onPress={() => navigation.navigate(ROUTE_NAMES.AUTH.RESET_PASSWORD)}>
                    <Text style={styles.forgot}>Forgot your password?</Text>
                </TouchableOpacity>
            </View>
            <Button mode="contained" onPress={onLoginPressed}>
                Login
            </Button>
            <View style={styles.row}>
                <Text>Don’t have an account? </Text>
                <TouchableOpacity onPress={() => navigation.replace(ROUTE_NAMES.AUTH.REGISTER)}>
                    <Text style={styles.link}>Sign up</Text>
                </TouchableOpacity>
            </View>
        </Background>
    );
}

const styles = StyleSheet.create({
    forgotPassword: {
        width: '100%',
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        marginTop: 4,
    },
    forgot: {
        fontSize: 13,
        color: theme.colors.secondary,
    },
    link: {
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
});
