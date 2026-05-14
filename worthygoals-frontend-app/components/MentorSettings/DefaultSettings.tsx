import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    View,
    Image,
    Dimensions
} from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DefaultSettingsComponent() {
    const { colors } = useAppTheme();

    const menuItems = [
        { title: 'General Settings', logo: require('@/assets/images/icons/settings_icon.png'), onPress: () => { } },
        { title: 'Notifications', logo: require('@/assets/images/icons/notification.png'), onPress: () => { } },
        { title: 'Premium Features', logo: require('@/assets/images/icons/premium.png'), onPress: () => { } },
        { title: 'Language', logo: require('@/assets/images/icons/internet.png'), onPress: () => { } },
        { title: 'Share with Friends', logo: require('@/assets/images/icons/settings_icon.png'), onPress: () => { } },
        { title: 'Terms of Use', logo: require('@/assets/images/icons/settings_icon.png'), onPress: () => { } },
        { title: 'Support & FAQs', logo: require('@/assets/images/icons/settings_icon.png'), onPress: () => { } },
    ];

    const renderMenuItem = ({ item }: { item: typeof menuItems[0] }) => {
        return (
            <>
                <TouchableOpacity style={staticStyles.menuItem} onPress={item.onPress}>
                    <Image source={item.logo} style={{ width: SCREEN_WIDTH * 0.07, height: SCREEN_WIDTH * 0.07 }} />
                    <Text style={[staticStyles.menuItemText, { color: colors.textWhite }]}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                <View style={[staticStyles.line, { backgroundColor: colors.textFaint }]} />
            </>
        );
    };

    return (
        <FlatList
            data={menuItems}
            keyExtractor={(item) => item.title}
            renderItem={renderMenuItem}
            style={staticStyles.menuList}
            contentContainerStyle={staticStyles.menuListContainer}
        />
    );
}

const staticStyles = StyleSheet.create({
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        marginLeft: 20,
    },
    line: {
        height: 1,
        width: '85%',
        alignSelf: 'center',
    },
    menuList: {
        flex: 1,
    },
    menuListContainer: {},
});
