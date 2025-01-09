import Background from '@/components/SubComponents/Background';
import { ROUTE_NAMES } from '@/constants';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
} from 'react-native';

const MotivationalBoardsScreen = () => {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    navigation.navigate(ROUTE_NAMES.INSPIRATION.self, { screen: ROUTE_NAMES.INSPIRATION.DEFAULT_SCREEN })

}

export default MotivationalBoardsScreen;
