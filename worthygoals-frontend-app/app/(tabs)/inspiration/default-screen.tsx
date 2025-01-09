import BorderGradient from '@/components/Common/BorderGradient';
import Background from '@/components/SubComponents/Background';
import Header from '@/components/SubComponents/Header';
import { ROUTE_NAMES } from '@/constants';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import Animated from 'react-native-reanimated';

const categories = ['Workout', 'Books', 'Reading', 'Outdoors', 'Vis'];
const { width } = Dimensions.get('window');
type BoardsCardItem = {
    id: number;
    type: string;
    author: string;
    uri: string,
    category: string,
    borderColor: string
}
const cardsData: BoardsCardItem[] = [
    {
        id: 1,
        type: 'quote',
        author: 'William James',
        uri: 'https://plus.unsplash.com/premium_photo-1671599016130-7882dbff302f?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        category: 'Workout',
        borderColor: '#E0748F'
    }, {
        id: 2,
        type: 'quote',
        uri: 'https://images.unsplash.com/photo-1534196511436-921a4e99f297?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: 'Scarlett Johansson',
        category: 'Workout',
        borderColor: '#4995E2'
    },
    {
        id: 3,
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1523293836414-f04e712e1f3b?q=80&w=2503&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: 'Scarlett Johansson',
        category: 'Books',
        borderColor: '#D87EEC'
    },
    {
        id: 4,
        type: 'quote',
        uri: 'https://images.unsplash.com/photo-1528716321680-815a8cdb8cbe?q=80&w=2565&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: 'Walt Whitman',
        category: 'Books',
        borderColor: '#D87EEC'
    },
    {
        id: 5,
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1495001258031-d1b407bc1776?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: '',
        category: 'Reading',
        borderColor: '#E0748F'
    },
    {
        id: 6,
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1612436524004-4f90d7fe71a5?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: '',
        category: 'Reading',
        borderColor: '#E0748F'
    },
    {
        id: 7,
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1608999383953-d61f5d9c1ace?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: '',
        category: 'Reading',
        borderColor: '#4995E2'
    },
    {
        id: 8,
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1669477377105-0736689c9935?q=80&w=2021&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: '',
        category: 'Reading',
        borderColor: '#4995E2'
    },
];

const MotivationalBoardsScreen: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('Reading');
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    return (
        <Background style={styles.container}>
            <View style={styles.titleContainer}>
                <Header>Motivational Boards</Header>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((cat) => {
                    const isActive = cat === selectedCategory;
                    return (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            style={[
                                styles.categoryButton,
                                isActive && styles.activeCategoryButton,
                            ]}
                        >
                            <Text style={[styles.categoryText, isActive && styles.activeCategoryText,]}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.cardsContainer}>
                {cardsData.map((card, i) => {
                    return (
                        <BorderGradient borderWidth={3} colors={[card.borderColor, '#1F1F21']} key={card.id}
                            start={{ x: i % 2 == 0 ? 1 : 0, y: i % 2 == 0 ? 1 : 0 }}
                            end={{ x: i % 2 == 1 ? 1 : 0, y: i % 2 == 0 ? 1 : 0 }}
                            outerStyle={{ marginVertical: 5 }}
                        >
                            <TouchableOpacity key={card.id} onPress={() => {
                                navigation.navigate(ROUTE_NAMES.TABS.INSPIRATION.IMAGE_VIEWER,
                                    { imageUri: card.uri, tag: `${card.id}-tag-board`, borderColor: card.borderColor })
                            }} style={styles.cardButton} >
                                <Animated.Image
                                    source={{
                                        uri: card.uri,
                                    }}
                                    sharedTransitionTag={`${card.id}-tag-board`}
                                    style={styles.profileImage}
                                />
                            </TouchableOpacity>
                        </BorderGradient>
                    );
                })}
            </ScrollView>
        </Background>
    );
};

export default MotivationalBoardsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        padding: 15
    },
    titleContainer: {
        alignItems: 'flex-start',
    },
    categoryScroll: {
        marginVertical: 8,
        paddingHorizontal: 8,
    },
    categoryButton: {
        marginRight: 16,
        paddingVertical: 6,
    },
    activeCategoryButton: {
        borderBottomColor: '#FFFFFF',
        borderBottomWidth: 2,
    },
    categoryText: {
        fontSize: 16,
        color: '#AAAAAA',
    },
    activeCategoryText: {
        color: '#FFFFFF',
    },
    cardsContainer: {
        padding: 8,
        paddingBottom: 40,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardButton: {
        width: width / 2.4,
        height: width / 2.4,
        borderRadius: 12,
        overflow: 'hidden',
    },
});
