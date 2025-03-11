// AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import Storage from '@/helpers/SecureStorageUtil';
import { ID_TOKEN, ROUTE_NAMES } from '@/constants';
import { clearTokens, decodeJwtToken, getUserLocationAsync } from '@/helpers';
import { CommonActions, ParamListBase } from '@react-navigation/native';

import { authEmitter } from '@/core';
import { LocationCoordinates, UserModel } from '@/models';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';
import userService from '@/services/UserService';
import { useToast } from './useToastNotification';

interface AuthContextProps {
    isAuthenticated: boolean;
    login: (email: string) => Promise<void>;
    logout: () => void;
    setAuthenticated: (value: boolean) => void;
    userProfile: Partial<UserModel> | null;
    userLocation?: LocationCoordinates;
    setUserProfile: (value: Partial<UserModel>) => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    const [userProfile, setUserProfile] = useState<Partial<UserModel> | null>(null);

    // Create a custom Navigator that will be used throughout the app, so that it checks for routes and roles
    // On app start, check if tokens exist

    const [userLocation, setUserLocation] = useState<LocationCoordinates | undefined>(undefined);


    // const getUserLocation = async () => {
    //     const location = await getUserLocationAsync();
    //     setUserLocation(location);
    // }

    const checkAuth = async () => {
        const token = await Storage.getItem(ID_TOKEN);

        if (!token) return;

        const { email } = decodeJwtToken(token);
        if (!email)
            throw new Error('Email is undefined in the token');

        await login(email);
    };

    useEffect(() => {
        const logoutHandler = () => {
            logout();
            console.log('Log out event by Token outdate!');
        };
        authEmitter.on('logout', logoutHandler);
        return () => {
            authEmitter.off('logout', logoutHandler);
        };
    }, []);

    const login = async (email: string) => {
        //   showSuccessMessage(`Logged In as ${email}`);
        setUserProfile({ email });
        setIsAuthenticated(true);
        await onSuccessfulLogin();
    };

    const onSuccessfulLogin = async () => {

        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: ROUTE_NAMES.TABS.self }],
            })
        );

        const profile = await userService.getUserProfile();

        if (profile) {
            setUserProfile(profile);
            navigation.navigate(ROUTE_NAMES.TABS.self, { screen: ROUTE_NAMES.TABS.HOME_SCREEN });
        }
        else {
            navigation.navigate(`${ROUTE_NAMES.PROFILE.self}/${ROUTE_NAMES.PROFILE.REGISTER_PROFILE}`);
            return;
        }
    };

    const logout = async () => {
        await clearTokens();
        setIsAuthenticated(false);
        //     showInfoMessage('Logged out!');
        // navigation.dispatch(
        //     CommonActions.reset({
        //         index: 0,
        //         routes: [{ name: ROUTE_NAMES.AUTH.self }],
        //     })
        // );
        // navigation.replace(ROUTE_NAMES.AUTH.LOGIN);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, setAuthenticated: setIsAuthenticated, userProfile, setUserProfile, checkAuth, userLocation }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
