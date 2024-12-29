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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DefaultSettingsComponent() {

    // Sample menu items for the lower list
    const menuItems = [
        { title: 'General Settings', logo: require('@/assets/images/icons/settings_icon.png'), onPress: () => { } },
        { title: 'Notifications', logo: require('@/assets/images/icons/notification.png'), onPress: () => { } },
        { title: 'Premium Features', logo: require('@/assets/images/icons/premium.png'), onPress: () => { } },
        { title: 'Language', logo: require('@/assets/images/icons/internet.png'), onPress: () => { } },
        { title: 'Share with Friends', logo: require('@/assets/images/icons/settings_icon.png'), onPress: () => { } },
        { title: 'Terms of Use', logo: require('@/assets/images/icons/settings_icon.png'), onPress: () => { } },
        { title: 'Support & FAQs', logo: require('@/assets/images/icons/settings_icon.png'), onPress: () => { } },
    ];
    console.log('DefaultSettingsComponent');
    const renderMenuItem = ({ item }: { item: typeof menuItems[0] }) => {
        return (
            <>
                <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                    <Image source={item.logo} style={{ width: SCREEN_WIDTH * 0.07, height: SCREEN_WIDTH * 0.07 }} />
                    <Text style={styles.menuItemText}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#AAA" />
                </TouchableOpacity>
                <View style={styles.line} />
            </>
        );
    };

    return (
        <FlatList
            data={menuItems}
            keyExtractor={(item) => item.title}
            renderItem={renderMenuItem}
            style={styles.menuList}
            contentContainerStyle={styles.menuListContainer}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
        color: "white"
    },
    line: {
        height: 1,
        width: '85%',
        backgroundColor: '#B3B3B3',
        alignSelf: 'center',
    },
    menuList: {
        flex: 1,
    },
    menuListContainer: {

    },
});