import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';
import { Colors, Palette } from '@/constants';
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
    // Opaque status colours with white text (all ≥ 5:1). The app mounts no
    // PaperProvider, so Snackbar's text was MD3's near-white inverseOnSurface —
    // drawn on the 12%-alpha "subtle" tints, every toast was near-invisible.
    const [backgroundColor, setBackgroundColor] = useState<string>(Palette.infoBase);

    const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setMessage(msg);
        setBackgroundColor(
            type === 'success' ? Palette.successBase :
                type === 'error' ? Palette.errorBase :
                    Palette.infoBase
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
                theme={{ colors: { inverseOnSurface: colors.textWhite } }}
                accessibilityLiveRegion="polite"
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
