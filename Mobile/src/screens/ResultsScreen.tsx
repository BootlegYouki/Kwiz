import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TuiContainer } from '../components/tui-container';
import { TuiText } from '../components/tui-text';
import { TuiButton } from '../components/tui-button';
import { QuizSet } from '../types';
import { useTheme } from '../theme/theme-provider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ResultsScreenProps {
  quiz: QuizSet;
  score: number;
  answers: string[];
  onBackToMenu: () => void;
  onRetake: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ quiz, score, answers, onBackToMenu, onRetake }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const totalQuestions = quiz.questions.length;
  const percentage = Math.round((score / totalQuestions) * 100);

  const getReviewComment = () => {
    if (percentage === 100) return 'Perfect score! Excellent!';
    if (percentage >= 80) return 'Great work! Superb!';
    if (percentage >= 50) return 'Passed! Keep improving!';
    return 'Failed. Try studying more!';
  };

  const isCorrect = (index: number) => {
    const question = quiz.questions[index];
    const answer = answers[index] || '';
    return answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Results Banner */}
        <TuiContainer label="Summary Sheet" badge="Results" accentBorder={true}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreCircle}>
              <TuiText size="3xl" weight="bold" style={{ color: colors.primary }}>
                {score}
              </TuiText>
              <TuiText size="xs" style={{ color: colors.mutedForeground, marginTop: -2 }}>
                OF {totalQuestions}
              </TuiText>
            </View>
            <View style={styles.scoreDetails}>
              <TuiText size="2xl" weight="bold">
                {percentage}%
              </TuiText>
              <TuiText size="sm" weight="bold" style={{ color: colors.mutedForeground, marginTop: 4 }}>
                {getReviewComment()}
              </TuiText>
            </View>
          </View>


        </TuiContainer>


        <View style={styles.reviewList}>
          {quiz.questions.map((question, idx) => {
            const correct = isCorrect(idx);
            const userAns = answers[idx] || 'No Answer';
            
            return (
              <TuiContainer
                key={idx}
                label={`Line 0${idx + 1}`}
                badge={correct ? 'Correct' : 'Wrong'}
                borderColor={correct ? '#10B981' : colors.destructive}
                style={{
                  backgroundColor: correct ? '#10B98108' : colors.destructive + '08',
                }}
              >
                <TuiText weight="bold" size="sm" style={{ marginVertical: 6 }}>
                  {question.question}
                </TuiText>
                
                <TuiText size="sm" style={{ marginVertical: 2, color: colors.mutedForeground }}>
                  INPUT: <TuiText size="sm" weight="bold" style={{ color: correct ? '#10B981' : colors.destructive }}>{userAns}</TuiText>
                </TuiText>

                {!correct && (
                  <TuiText size="sm" style={{ color: colors.mutedForeground, marginTop: 4 }}>
                    EXPECTED: <TuiText size="sm" weight="bold" style={{ color: '#10B981' }}>{question.answer}</TuiText>
                  </TuiText>
                )}
              </TuiContainer>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Container */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.actionButtonsRow}>
          <TuiButton onPress={onBackToMenu} variant="outline" style={styles.halfBtn} fullWidth={false}>
            Return Home
          </TuiButton>
          <TuiButton onPress={onRetake} variant="accent" style={styles.halfBtn} fullWidth={false}>
            Retake Quiz
          </TuiButton>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreCircle: {
    borderWidth: 1.5,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  breakdownLabel: {
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  reviewList: {
    gap: 12,
    marginTop: 20,
  },
  reviewItem: {
    borderWidth: 1.5,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    paddingBottom: 4,
    marginBottom: 4,
  },
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  scoreBarTicks: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  scoreBarTick: {
    height: 12,
    flex: 1,
    borderWidth: 1.5,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  halfBtn: {
    flex: 1,
    marginVertical: 4,
    paddingVertical: 16,
  },
  backBtn: {
    marginTop: 24,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    width: '100%',
  },
});
