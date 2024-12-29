import React from 'react';
import {
    Text,
    StyleSheet,
} from 'react-native';


export default function DefaultSettingsComponent() {
    return (
        <Text >Default Settings Content</Text>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    menuItemText: {
        fontSize: 16,
    },
    line: {
        height: 1,
        backgroundColor: '#DDD',
    },
});