import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import dayjs from 'dayjs';

const WeeklyDatePicker = () => {
    // Calculate the latest Monday
    const today = dayjs();
    const monday = today.day() === 0 ? today.subtract(6, 'day') : today.subtract(today.day() - 1, 'day');

    // Generate the 7 days of the week starting from the latest Monday
    const daysOfWeek = Array.from({ length: 7 }, (_, idx) => monday.add(idx, 'day'));

    return (
        <View style={styles.dateBarContainer}>
            {daysOfWeek.map((day, idx) => (
                <Pressable
                    key={idx}
                    style={[
                        styles.dateItem,
                        day.isSame(today, 'day') && styles.selectedDateItem // Highlight the current day
                    ]}
                >
                    <Text
                        style={[
                            styles.dateItemText,
                            day.isSame(today, 'day') && styles.selectedDateText
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

const styles = StyleSheet.create({
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
        color: '#999',
        fontWeight: '400',
    },
    selectedDateItem: {
        borderColor: '#fff',
        borderWidth: 2,
    },
    selectedDateText: {
        color: 'white',
        fontWeight: '400',
    },
});

export default WeeklyDatePicker;
