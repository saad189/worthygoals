
import { Colors } from '@/constants';
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';

interface LoaderContextProps {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

const LoaderContext = createContext<LoaderContextProps | undefined>(undefined);

export const LoaderProvider: React.FC<{ children: ReactNode, loaderSize?: number, loaderColor?: string }> = ({ children, loaderSize = 80 }) => {
    const [isLoading, setIsLoading] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <LoaderContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
            {children}
            {isLoading && (
                <View style={styles.loaderContainer}>
                    <View style={[styles.loader, { width: 100, height: 100 }]}>
                        <ActivityIndicator size="large" color={colors.buttonBackgroundColor} style={{ transform: [{ scale: loaderSize / 36 }] }} />
                    </View>
                </View>
            )}
        </LoaderContext.Provider>
    );
};

export const useLoader = (): LoaderContextProps => {
    const context = useContext(LoaderContext);
    if (!context) {
        throw new Error('useLoader must be used within a LoaderProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    loader: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
