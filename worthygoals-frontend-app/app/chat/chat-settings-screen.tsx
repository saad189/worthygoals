import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import Background from '@/components/SubComponents/Background';
import { ParamListBase, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import CurrentGoalsComponent from '@/components/MentorSettings/CurrentGoals';
import NewGoalsComponent from '@/components/MentorSettings/NewGoals';
import AIPersonalitySettingsComponent from '@/components/MentorSettings/AIPersonalitySettings';
import { StackNavigationProp } from '@react-navigation/stack';
import GradientText from '@/components/SubComponents/GradientText';
import DefaultSettingsComponent from '@/components/MentorSettings/DefaultSettings';
import mentorService from '@/services/mentor.service';
import { Mentor } from '@/models';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Define the available tabs
enum Tabs {
    CURRENT_GOALS = 'CurrentGoals',
    AI_PERSONALITY = 'AIPersonality',
    SET_GOALS = 'SetGoals',
    SETTINGS = 'Settings',
}
const iconColor = '#FFF';
const iconColorActive = '#E65581';

type TabItem = {
    key: Tabs;
    title: string;
    onPress: () => void;
    logo: any;
    logoActive: any;
    component: React.FC;
}

const TabButton = ({ onPress, logo, title, logoActive, isActive }: TabItem & { isActive: boolean }) => {

    return (
        <TouchableOpacity
            style={[styles.tabButton, isActive && styles.tabButtonSelected]}
            onPress={onPress}
        >
            <Image source={isActive ? logoActive : logo} style={{ width: SCREEN_WIDTH * 0.1, height: SCREEN_WIDTH * 0.11 }} />
            <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextSelected]} numberOfLines={2} adjustsFontSizeToFit={true}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const SettingsScreen: React.FC = () => {
    // Keep track of which tab is currently selected
    const { params: { mentorId } } = useRoute() as any;
    const id = Number(mentorId);
    const [mentor, setMentor] = useState<Mentor>({
        id: 0,
        name: "",
        description: "",
        personalityStats: { energy: 90, focus: 80 },
        imageUri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOKOsPbE9WMa8ZO1iNNeFgoI0DWBjH8cMCwg&s",
    },)

    useFocusEffect(
        useCallback(() => {
            mentorService.getMentorById(id).then((data: Mentor | null) => {
                console.log({ fetchedData: data, mentorId })
                if (data)
                    setMentor(data);
            })
        }, [])
    );
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const tabItems: TabItem[] = [
        {
            key: Tabs.CURRENT_GOALS,
            title: 'Current Goals Status',
            onPress: () => setSelectedTab(Tabs.CURRENT_GOALS),
            logo: require('@/assets/images/icons/current_goals_icon.png'),
            component: CurrentGoalsComponent,
            logoActive: require('@/assets/images/icons/current_goals_active_icon.png'),
        },
        {
            key: Tabs.AI_PERSONALITY,
            title: 'AI Personality Settings',
            onPress: () => setSelectedTab(Tabs.AI_PERSONALITY),
            logo: require('@/assets/images/icons/ai_big_icon.png'),
            component: AIPersonalitySettingsComponent,
            logoActive: require('@/assets/images/icons/ai_big_active_icon.png'),
        },
        {
            key: Tabs.SET_GOALS,
            title: 'Set New Goals',
            onPress: () => setSelectedTab(Tabs.SET_GOALS),
            logo: require('@/assets/images/icons/new_goals_icon.png'),
            component: NewGoalsComponent,
            logoActive: require('@/assets/images/icons/new_goals_active_icon.png'),
        },
    ];

    const settingsTab = {
        key: Tabs.SETTINGS,
        title: 'Settings',
        onPress: () => setSelectedTab(Tabs.SETTINGS),
        logo: require('@/assets/images/icons/settings_icon.png'),
        component: DefaultSettingsComponent
    };

    const [selectedTab, setSelectedTab] = useState<Tabs | null>(settingsTab.key);

    const ActiveTabItem = tabItems.find(item => item.key === selectedTab);
    const ActiveComponent = ActiveTabItem ? ActiveTabItem.component : settingsTab.component;

    return (
        <SafeAreaView style={styles.container}>
            {/* Profile Section */}
            <ScrollView>
                <View style={styles.profileContainer}>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', alignItems: 'center' }}>
                        <TouchableOpacity onPress={navigation.goBack} style={{ marginLeft: 5 }}>
                            <Ionicons name="arrow-back" size={24} color={iconColor} />
                        </TouchableOpacity>
                        <View style={styles.profileImageWrapper}>
                            <Image
                                source={{
                                    uri: mentor.imageUri,
                                }}
                                style={styles.profileImage}
                            />
                        </View>
                        <TouchableOpacity onPress={settingsTab.onPress} style={{ marginLeft: 5 }} >
                            <Ionicons name="settings" size={24} color={selectedTab == settingsTab.key ? iconColorActive : iconColor} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ minHeight: '5%', width: '100%', alignItems: 'center' }}>
                        <Text style={{ fontSize: 26, color: '#FFC371', fontWeight: 'bold' }}>AI {mentor.name}</Text>
                        {/* <GradientText text={`AI ${mentor.name}`}
                        style={{ fontSize: 26, color: '#FFF', fontWeight: 'bold' }} /> */}

                    </View>
                </View>

                {/* Top Tab Buttons */}
                <View style={styles.tabsContainer}>
                    {tabItems.map(tab => (
                        <TabButton
                            {...tab}
                            isActive={selectedTab === tab.key}
                        />
                    ))}
                </View>

                <View style={styles.contentContainer}>
                    {ActiveComponent ? <ActiveComponent /> : null}
                </View>
                <View style={{ marginBottom: 20 }}></View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default function SettingsScreenWithBackground() {
    return (
        <Background style={styles.container}>
            <SettingsScreen />
        </Background>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileContainer: {
        paddingTop: 50,
        backgroundColor: 'rgba(168, 168, 168,0.3)'
    },
    profileImageWrapper: {
        width: 150,
        height: 150,
        borderRadius: 75,
        overflow: 'hidden',
        marginBottom: 10,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    profileName: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        backgroundColor: 'rgba(168, 168, 168,0.3)',
        borderBottomEndRadius: 30,
        borderBottomLeftRadius: 30,
        paddingVertical: 20,
        marginBottom: 10
    },
    tabButton: {
        paddingVertical: 8,
        width: SCREEN_WIDTH / 3.3,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#D9D9D9',
        alignItems: 'center',
        justifyContent: 'space-evenly'
    },
    tabButtonSelected: {
        backgroundColor: '#E65581',
    },
    tabButtonText: {
        fontWeight: '600',
        width: '75%',
        textAlign: 'center',
        fontSize: 12,
    },
    tabButtonTextSelected: {
        color: '#FFF',
    },
    contentContainer: {
        padding: 10,
        flex: 1,
    },
    contentText: {
        color: '#FFF',
        fontSize: 16,
        marginBottom: 10,
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,

    },
    menuItemText: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
    },
});
