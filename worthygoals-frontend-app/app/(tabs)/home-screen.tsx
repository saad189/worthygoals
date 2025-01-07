import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Header from '@/components/SubComponents/Header';
import Background from '@/components/SubComponents/Background';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/core';
import WeeklyDatePicker from '@/components/CalenderView';
import BorderGradient from '@/components/Common/BorderGradient';

const DashboardScreen = () => {
  const [selectedDate, setSelectedDate] = useState('2023-10-14');
  type CardInfo = {
    id: number,
    title: string,
    dayStreak: number,
    progressCurrent: number,
    progressTotal: number,
    progressUnit: string;
    borderColor: string
  }
  const cardsData: CardInfo[] = [
    {
      id: 1,
      title: 'Reading Book',
      dayStreak: 8,
      progressCurrent: 3,
      progressTotal: 5,
      progressUnit: 'pages',
      borderColor: '#E0748F'
    },
    {
      id: 2,
      title: 'Meditation',
      dayStreak: 4,
      progressCurrent: 8,
      progressTotal: 20,
      progressUnit: 'min',
      borderColor: '#4995E2'
    },
    {
      id: 3,
      title: 'Running',
      dayStreak: 2,
      progressCurrent: 12,
      progressTotal: 20,
      progressUnit: 'min',
      borderColor: '#D87EEC'
    },
    {
      id: 4,
      title: 'Power Lifting',
      dayStreak: 8,
      progressCurrent: 12,
      progressTotal: 20,
      progressUnit: 'min',
      borderColor: '#D87EEC'
    },
  ];

  // Example of how you might set a “goals completed” progress:
  const goalsCompleted = 3;
  const totalGoals = 8;
  const goalsPercentage = Math.round((goalsCompleted / totalGoals) * 100);

  return (
    <Background style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 80 }}>

        {/* Header / Title */}
        <View style={{ alignSelf: 'flex-start' }}>
          <Header>Welcome to Evolve</Header>
        </View>

        <WeeklyDatePicker />

        <View style={styles.goalsContainer}>
          <LinearGradient
            colors={['#4796E4', '#E6738C']}
            style={styles.goalsCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.goalsContent}>
              <View style={{ flexDirection: 'row', borderRadius: 50, borderWidth: 2, borderColor: 'white', alignItems: 'center', }}>
                <Text style={styles.goalsPercentage}>{goalsPercentage}
                  <Text style={{ color: 'white', marginTop: 15, fontSize: 15 }}>%</Text>
                </Text>
              </View>

              <View style={styles.goalsTextContainer}>
                <Text style={styles.goalsTitle}>
                  Great! Your daily Goals almost done.
                </Text>
                <Text style={styles.goalsSubtitle}>
                  {goalsCompleted}/{totalGoals} Completed
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={{ alignSelf: 'flex-start', marginBottom: 5 }}>
          <Text style={styles.todayText}>TODAY</Text>
        </View>
        {/* Cards */}
        <View style={styles.cardsContainer}>
          {cardsData.map((card, i) => (
            <BorderGradient borderWidth={2} colors={[card.borderColor, '#1F1F21']}
              start={{ x: i % 2 == 0 ? 1 : 0, y: i % 2 == 0 ? 1 : 0 }}
              end={{ x: i % 2 == 1 ? 1 : 0, y: i % 2 == 0 ? 1 : 0 }}
              outerStyle={{ marginVertical: 5 }}
            >
              <View key={card.id} style={styles.card}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDayStreak}>
                  {card.dayStreak} days
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.cardProgress}>{card.progressCurrent} / {card.progressTotal}</Text>
                  <Text style={styles.cardProgressUnit}>{card.progressUnit}</Text>
                </View>

                {/* + Button (Add progress) */}
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </BorderGradient>
          ))}
        </View>

        {/* Challenges Section */}
        {/* <Text style={styles.subHeading}>CHALLENGES</Text> */}
        {/* Add your challenge section here */}

      </ScrollView>
    </Background >
  );
};

export default DashboardScreen;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50
  },
  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
  },

  todayText: {
    fontFamily: 'Outfit',
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '500',
    paddingVertical: 12,
    textAlign: 'center'
  },
  goalsContainer: {
    marginBottom: 20,
    marginHorizontal: 4
  },
  goalsCardGradient: {
    // padding: 12,
    flex: 1,
    borderRadius: 12,
    padding: 8,
    paddingVertical: 14,
  },
  goalsContent: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center'
  },

  goalsTextContainer: {
    marginLeft: 12,
  },
  goalsTitle: {
    color: theme.colors.textWhite,
    fontSize: 14,
    fontWeight: '500',
  },
  goalsPercentage:
  {
    fontSize: 30,
    color: 'white',
    fontWeight: '400',
    padding: 16,
    paddingHorizontal: 14,
    alignContent: 'center',
    position: 'relative',
    left: 3,
    bottom: 2
  },

  goalsSubtitle: {
    color: theme.colors.textWhite,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 6
  },

  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: width / 2.3,
    height: width / 2.3,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
  },
  cardTitle: {
    marginTop: 20,
    color: theme.colors.textWhite,
    fontSize: 18,
    fontWeight: '400',
  },
  cardDayStreak: {
    width: '40%',
    borderRadius: 12,
    backgroundColor: '#4E3139',

    color: theme.colors.textWhite,
    fontSize: 12,
    marginVertical: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    textAlign: 'center'
  },
  cardProgress: {
    color: theme.colors.textWhite,
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '400'
  },
  cardProgressUnit: {
    color: theme.colors.textWhite,
    fontSize: 11,
    marginBottom: 10,
    marginLeft: 10,
    fontWeight: '400',
    alignSelf: 'flex-end',
  },
  addButton: {
    position: 'absolute',
    right: '15%',
    bottom: '15%',
    width: '25%',
    height: '25%',
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',

  },
  addButtonText: {
    color: theme.colors.textWhite,
    fontSize: 25,

  },
  subHeading: {
    fontSize: 16,
    color: theme.colors.textWhite,
    fontWeight: '600',
    marginVertical: 8,
  },
});
