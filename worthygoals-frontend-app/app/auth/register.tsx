import BackButton from '@/components/SubComponents/BackButton';
import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import Logo from '@/components/SubComponents/Logo';
import TextInput from '@/components/SubComponents/TextInput';
import { ROUTE_NAMES } from '@/constants/Routes';
import { theme } from '@/core';
import { emailValidator, nameValidator, passwordValidator } from '@/helpers';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Header } from 'react-native/Libraries/NewAppScreen';


type Props = {
    navigation: any;
};

export default function RegisterScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    const [name, setName] = useState<{ value: string; error: string }>({ value: '', error: '' });
    const [email, setEmail] = useState<{ value: string; error: string }>({ value: '', error: '' });
    const [password, setPassword] = useState<{ value: string; error: string }>({ value: '', error: '' });

    const onSignUpPressed = () => {
        const nameError = nameValidator(name.value);
        const emailError = emailValidator(email.value);
        const passwordError = passwordValidator(password.value);
        if (emailError || passwordError || nameError) {
            setName({ ...name, error: nameError });
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
            {/* <BackButton goBack={navigation.goBack} /> */}
            <Logo />
            <Header>Create Account</Header>
            <TextInput
                label="Name"
                returnKeyType="next"
                value={name.value}
                onChangeText={(text: any) => setName({ value: text, error: '' })}
                error={!!name.error}
                errorText={name.error}
            />
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
            <Button mode="contained" onPress={onSignUpPressed} style={{ marginTop: 24 }}>
                Sign Up
            </Button>
            <View style={styles.row}>
                <Text>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.replace(ROUTE_NAMES.AUTH.LOGIN)}>
                    <Text style={styles.link}>Login</Text>
                </TouchableOpacity>
            </View>
        </Background>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        marginTop: 4,
    },
    link: {
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
});
