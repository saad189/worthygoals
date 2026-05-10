import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';
import { Colors } from '@/constants';
import { useColorScheme } from 'react-native';

// 🟢 Create Context
interface ToastContextType {
    showInfoMessage: (msg: string) => void;
    showSuccessMessage: (msg: string) => void;
    showErrorMessage: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 🟠 Toast Provider Component
export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [backgroundColor, setBackgroundColor] = useState(colors.notificationInfo);

    const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setMessage(msg);
        setBackgroundColor(
            type === 'success' ? colors.notificationSuccess :
                type === 'error' ? colors.notificationError :
                    colors.notificationInfo
        );
        setVisible(true);
    };

    return (
        <ToastContext.Provider value={{
            showInfoMessage: (msg) => showToast(msg, 'info'),
            showSuccessMessage: (msg) => showToast(msg, 'success'),
            showErrorMessage: (msg) => showToast(msg, 'error'),
        }}>
            {children}

            {/* 🟢 Global Snackbar (Automatically renders) */}
            <Snackbar
                visible={visible}
                onDismiss={() => setVisible(false)}
                duration={3000}
                style={{ backgroundColor, borderRadius: 12, alignSelf: 'center', width: '60%', alignItems: 'center' }}
            >
                {message}
            </Snackbar>
        </ToastContext.Provider>
    );
};

// 🟢 Custom Hook for Using Toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
