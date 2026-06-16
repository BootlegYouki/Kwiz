import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { QuizCard } from '../components/quiz-card';
import { TuiText } from '../components/tui-text';
import { QuizSet } from '../types';
import { useTheme } from '../theme/theme-provider';

interface HomeScreenProps {
  quizzes: QuizSet[];
  onSelectQuiz: (quiz: QuizSet) => void;
  onLongPressQuiz?: (quiz: QuizSet, bounds: { x: number; y: number; width: number; height: number }) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ quizzes, onSelectQuiz, onLongPressQuiz }) => {
  const { colors } = useTheme();


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.quizList}>
          {quizzes.length === 0 ? (
            <View style={[styles.emptyContainer, { borderColor: colors.primary, marginTop: 8 }]}>
              <TuiText weight="bold" style={{ textAlign: 'center' }}>
                No other quizzes available.
              </TuiText>
              <TuiText size="sm" style={{ textAlign: 'center', color: colors.mutedForeground, marginTop: 8 }}>
                Tap the Add Quiz button below to configure and create your first quiz!
              </TuiText>
            </View>
          ) : (
            quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onPress={() => onSelectQuiz(quiz)}
                onLongPress={(bounds) => onLongPressQuiz?.(quiz, bounds)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  quizList: {
    width: '100%',
  },
  emptyContainer: {
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
});
