import BorderGradient from '@/components/Common/BorderGradient';
import Background from '@/components/SubComponents/Background';
import Header from '@/components/SubComponents/Header';
import { ROUTE_NAMES } from '@/constants';
import { BoardsCardItem } from '@/models';
import inspirationService from '@/services/inspiration.service';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import Animated from 'react-native-reanimated';

const categories = ['All', 'Workout', 'Books', 'Reading', 'Outdoors', 'Visualization'];
const { width } = Dimensions.get('window');

const MotivationalBoardsScreen: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
    const [cardsData, setCardsData] = useState<BoardsCardItem[]>([]);
    const [filteredCards, setFilteredCards] = useState<BoardsCardItem[]>([]);
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    useFocusEffect(useCallback(() => { inspirationService.getAllCards().then(setCardsData) }, []));

    useEffect(() => {
        setFilteredCards(selectedCategory === 'All' ?
            cardsData : cardsData.filter(({ category }) => category === selectedCategory))

    }, [cardsData, selectedCategory]);

    return (
        <Background style={styles.container}>
            <View style={styles.titleContainer}>
                <Header>Motivational Boards</Header>
            </View>

            <View style={styles.categoryScrollWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                >
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
                                <Text style={[styles.categoryText, isActive && styles.activeCategoryText]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.cardsContainer}>
                <ScrollView contentContainerStyle={styles.cardsContentContainer}>
                    {filteredCards.map((card, i) => {
                        return (
                            <BorderGradient
                                borderWidth={3}
                                colors={[card.borderColor, '#1F1F21']}
                                key={card.id}
                                start={{ x: i % 2 === 0 ? 1 : 0, y: i % 2 === 0 ? 1 : 0 }}
                                end={{ x: i % 2 === 1 ? 1 : 0, y: i % 2 === 0 ? 1 : 0 }}
                                outerStyle={{ marginVertical: 5 }}
                            >
                                <TouchableOpacity
                                    key={card.id}
                                    onPress={() => {
                                        navigation.navigate(ROUTE_NAMES.TABS.INSPIRATION.IMAGE_VIEWER, {
                                            imageUri: card.uri,
                                            tag: `${card.id}-tag-board`,
                                            borderColor: card.borderColor,
                                        });
                                    }}
                                    style={styles.cardButton}
                                >
                                    <Animated.Image
                                        source={{ uri: card.uri }}
                                        sharedTransitionTag={`${card.id}-tag-board`}
                                        style={styles.profileImage}
                                    />
                                </TouchableOpacity>
                            </BorderGradient>
                        );
                    })}
                </ScrollView>
            </View>
        </Background>
    );
};

export default MotivationalBoardsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 15,
    },
    titleContainer: {
        marginBottom: 10,
    },
    categoryScrollWrapper: {
        flex: 0.1,
        maxHeight: 55,
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
        flex: 0.9,
    },
    cardsContentContainer: {
        padding: 8,
        paddingBottom: 40,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    cardButton: {
        width: width / 2.4,
        height: width / 2.4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
});
