import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    Platform, ScrollView
} from 'react-native';

import Slider from '@react-native-community/slider';


export interface AIPersonalitySettingsProps {
    name: string;
    description: string;
    settingId: number;
    value: number;
    isBoolean: boolean;
}

export const AIPersonalitySettings: AIPersonalitySettingsProps[] = [
    {
        name: 'Intensity',
        description: `Adjust the Intensity of your AI Coach. High Intensity means more messages, more push and more intensity.AI Coach may get angry if you don’t respond timely.`,
        settingId: 0,
        value: 0.5,
        isBoolean: false
    },
    {
        name: 'Brutal Honesty',
        description: `Adjust the Brutality in Communication of your AI Coach. Higher Brutality means, the AI will communicate in a harsher tone, it may use previous failure to highlight users lack of commitment.`,
        settingId: 1,
        value: 0,
        isBoolean: false
    },
    {
        name: 'Patience',
        description: `Adjust the Patience Level of your AI Coach. Higher Patience means the AI will be supportive and understanding, it will be acceptable of your excuses and will continue to motivate.`,
        settingId: 2,
        value: 1,
        isBoolean: false,
    },
    {
        name: 'Trash Talk',
        description: `Give the AI ability to communicate with some Trash Talk. It can be entertaining and somewhat intense and motivational.`,
        settingId: 3,
        value: 1,
        isBoolean: true,
    },
    {
        name: 'Attitude',
        description: `Activating this feature will allow AI to be more prideful and retaliate to slow responses.`,
        settingId: 4,
        value: 0,
        isBoolean: true,
    },
    {
        name: 'Empathy',
        description: `Empathy allows for AI to accept excuses, if goals are not meet. However you need to explain reasons for it to empathize.`,
        settingId: 5,
        value: 0,
        isBoolean: true,
    },
]

const AIPersonalitySettingsComponent: React.FC = () => {
    const [settings, setSettings] = useState<AIPersonalitySettingsProps[]>(AIPersonalitySettings);
    let value = 0;
    const updateSetting = (settingId: number, newValue: number) => {
        setSettings(prevSettings =>
            prevSettings.map(setting =>
                setting.settingId === settingId ? { ...setting, value: newValue } : setting
            )
        );
    };

    return (
        <ScrollView style={styles.container}>
            {settings.map(setting => (

                <View key={setting.settingId}>
                    <Text style={styles.label}>{setting.name}</Text>

                    {setting.isBoolean ? (
                        <View style={styles.switchRow}>
                            <Text style={styles.valueTextSwitch}>{setting.description}</Text>
                            <Switch
                                style={{ marginRight: 10 }}
                                trackColor={{ false: '#767577', true: '#E65581' }}
                                thumbColor={setting.value ? '#fff' : '#f4f3f4'}
                                onValueChange={() => updateSetting(setting.settingId, setting.value ? 0 : 1)}
                                value={!!setting.value}
                            />
                        </View>
                    ) : (
                        <View style={styles.sliderContainer}>
                            <Text style={styles.valueText}>{setting.description}</Text>
                            <Slider
                                style={{ flex: 1, marginHorizontal: 40, width: '90%' }}
                                minimumValue={0}
                                maximumValue={1}
                                step={0.5}
                                value={setting.value}
                                onValueChange={(val) => updateSetting(setting.settingId, val)}
                                minimumTrackTintColor="#E65581"
                                maximumTrackTintColor="#ccc"
                                thumbTintColor={Platform.OS === 'ios' ? '#E65581' : '#E65581'}
                                StepMarker={(val, i) =>
                                    <View>
                                        <Text numberOfLines={2}
                                            style={styles.stepMarker}>
                                            {value++ == 0 ? `Low` : (value == 2 ? `Normal ${JSON.stringify(i)}` : `High`)} {setting.name}
                                        </Text>
                                        <Text style={{ display: 'none' }}>{value > 2 ? value = 0 : null}</Text>
                                    </View>
                                }
                            />
                        </View>
                    )}
                </View>
            ))}
        </ScrollView>
    );
};

export default AIPersonalitySettingsComponent;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 10
    },
    label: {
        fontSize: 20,
        color: '#fff',
    },
    sliderContainer: {
        flexDirection: 'column',

        alignItems: 'center',
        marginBottom: 40,
    },
    sliderValue: {
        color: '#fff',
        fontSize: 14,
    },
    valueText: {
        color: '#fff',
        fontSize: 13,
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'left',
    },
    valueTextSwitch: {
        color: '#fff',
        fontSize: 13,
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'left',
        flex: 0.9
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
    stepMarker: {
        marginTop: 20,
        color: 'white',
        fontSize: 9,
        width: 70,
        textAlign: 'center'
    }
});
