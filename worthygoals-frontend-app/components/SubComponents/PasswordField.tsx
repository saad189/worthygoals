import React, { useState, forwardRef, memo } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import TextInput from '@/components/SubComponents/TextInput';
type Props = TextInputProps & {
    value: string;
    errorText?: string;
    description?: string;
    onChangeText: (text: string) => void;
}

const PasswordField = (({ value, onChangeText, onSubmitEditing, errorText, description }: Props) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <View style={styles.passwordContainer}>
            <TextInput
                label="Password"
                placeholder="Password"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!showPassword}
                onSubmitEditing={onSubmitEditing}
                returnKeyType="done"
                errorText={errorText}
                description={description}
            />
            <TouchableOpacity onPress={toggleShowPassword} style={styles.peekButton}>
                <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={24} color="black" />
            </TouchableOpacity>
        </View>
    );
});

const height = 50;
const borderRadius = 8;

const styles = StyleSheet.create({
    input: {
        height,
        borderColor: 'gray',
        borderWidth: 1,
        paddingHorizontal: 15,
        borderRadius,
        margin: 20,
        fontSize: 16
    },
    inputPassword: {
        flex: 1
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius,
        width: '100%'
    },
    peekButton: {
        position: 'absolute',
        top: height / 3,
        right: 15,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default memo(PasswordField);
