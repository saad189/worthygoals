import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    Platform,
} from 'react-native';

import Slider from '@react-native-community/slider';

const AIPersonalitySettingsComponent: React.FC = () => {
    const [patience, setPatience] = useState<number>(5); // slider range: 1 - 10
    const [trashTalkEnabled, setTrashTalkEnabled] = useState<boolean>(false);
    const [attitudeEnabled, setAttitudeEnabled] = useState<boolean>(false);
    const [empathyEnabled, setEmpathyEnabled] = useState<boolean>(false);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Personality Settings</Text>

            {/* Patience Slider */}
            <Text style={styles.label}>Patience</Text>
            <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>Low</Text>
                <Slider
                    style={{ flex: 1, marginHorizontal: 10 }}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    value={patience}
                    onValueChange={(val) => setPatience(val)}
                    minimumTrackTintColor="#E65581"
                    maximumTrackTintColor="#ccc"
                    thumbTintColor={Platform.OS === 'ios' ? '#E65581' : '#E65581'}
                />
                <Text style={styles.sliderValue}>High</Text>
            </View>
            <Text style={styles.valueText}>{`Current level: ${patience}`}</Text>

            {/* Trash Talk Switch */}
            <View style={styles.switchRow}>
                <Text style={styles.label}>Trash Talk</Text>
                <Switch
                    trackColor={{ false: '#767577', true: '#E65581' }}
                    thumbColor={trashTalkEnabled ? '#fff' : '#f4f3f4'}
                    onValueChange={() => setTrashTalkEnabled(!trashTalkEnabled)}
                    value={trashTalkEnabled}
                />
            </View>

            {/* Attitude Switch */}
            <View style={styles.switchRow}>
                <Text style={styles.label}>Attitude</Text>
                <Switch
                    trackColor={{ false: '#767577', true: '#E65581' }}
                    thumbColor={attitudeEnabled ? '#fff' : '#f4f3f4'}
                    onValueChange={() => setAttitudeEnabled(!attitudeEnabled)}
                    value={attitudeEnabled}
                />
            </View>

            {/* Empathy Switch */}
            <View style={styles.switchRow}>
                <Text style={styles.label}>Empathy</Text>
                <Switch
                    trackColor={{ false: '#767577', true: '#E65581' }}
                    thumbColor={empathyEnabled ? '#fff' : '#f4f3f4'}
                    onValueChange={() => setEmpathyEnabled(!empathyEnabled)}
                    value={empathyEnabled}
                />
            </View>
        </View>
    );
};

export default AIPersonalitySettingsComponent;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
        color: '#fff',
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        color: '#fff',
        marginVertical: 8,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sliderValue: {
        color: '#fff',
        fontSize: 14,
    },
    valueText: {
        color: '#fff',
        marginVertical: 5,
        textAlign: 'center',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
});
