import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import dayjs from 'dayjs';
import { useAppTheme } from '@/hooks/useAppTheme';

const WeeklyDatePicker = () => {
    const { colors } = useAppTheme();
    const today = dayjs();
    const monday = today.day() === 0 ? today.subtract(6, 'day') : today.subtract(today.day() - 1, 'day');
    const daysOfWeek = Array.from({ length: 7 }, (_, idx) => monday.add(idx, 'day'));

    return (
        <View style={staticStyles.dateBarContainer}>
            {daysOfWeek.map((day, idx) => (
                <Pressable
                    key={idx}
                    style={[
                        staticStyles.dateItem,
                        day.isSame(today, 'day') && { borderColor: colors.white, borderWidth: 2 },
                    ]}
                >
                    <Text
                        style={[
                            staticStyles.dateItemText,
                            { color: colors.textMuted },
                            day.isSame(today, 'day') && { color: colors.white },
                        ]}
                    >
                        {day.format('ddd')}
                        <Text style={{ fontSize: 20 }}>{day.format('\nD')}</Text>
                    </Text>
                </Pressable>
            ))}
        </View>
    );
};

const staticStyles = StyleSheet.create({
    dateBarContainer: {
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 16,
        justifyContent: 'space-between',
    },
    dateItem: {
        textAlign: 'center',
        paddingVertical: 2,
        width: '12%',
        borderRadius: 16,
    },
    dateItemText: {
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '400',
    },
});

export default WeeklyDatePicker;
