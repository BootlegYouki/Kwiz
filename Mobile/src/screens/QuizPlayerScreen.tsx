import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { TuiContainer } from '../components/tui-container';
import { TuiText } from '../components/tui-text';
import { TuiButton } from '../components/tui-button';
import { LetterBoxInput } from '../components/letter-box-input';
import { QuizSet, QuizQuestion } from '../types';
import { useTheme } from '../theme/theme-provider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface QuizPlayerScreenProps {
  quiz: QuizSet;
  onFinish: (score: number, answers: string[]) => void;
  onExit: () => void;
}

export const QuizPlayerScreen: React.FC<QuizPlayerScreenProps> = ({ quiz, onFinish, onExit }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalQuestions = quiz.questions.length;

  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(totalQuestions).fill(''));
  const [lockedStates, setLockedStates] = useState<boolean[]>(new Array(totalQuestions).fill(false));

  const currentQuestion: QuizQuestion = quiz.questions[currentIndex];
  const selectedAnswer = userAnswers[currentIndex] || '';
  const isLocked = lockedStates[currentIndex] || false;

  const handleChoicePress = (choice: string) => {
    if (isLocked) return;
    const nextAnswers = [...userAnswers];
    nextAnswers[currentIndex] = choice;
    setUserAnswers(nextAnswers);
  };

  const handleLockIn = () => {
    if (!selectedAnswer.trim()) return;
    const nextLocked = [...lockedStates];
    nextLocked[currentIndex] = true;
    setLockedStates(nextLocked);
  };

  const checkAnswer = (question: QuizQuestion, answerStr: string): boolean => {
    return !!answerStr && answerStr.toLowerCase().trim() === question.answer.toLowerCase().trim();
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate final score dynamically
      let finalScore = 0;
      quiz.questions.forEach((q, idx) => {
        if (checkAnswer(q, userAnswers[idx])) {
          finalScore += 1;
        }
      });
      onFinish(finalScore, userAnswers);
    }
  };

  const handleExitPress = () => {
    Alert.alert(
      'Exit Quiz',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: onExit },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Segmented Retro Progress Bar */}
        <TuiContainer label={`${currentIndex + 1} / ${totalQuestions}`}>
          <View style={[styles.progressOuterRow, { height: 30 }]}>
            {quiz.questions.map((q, idx) => {
              const isAnswered = lockedStates[idx];
              const answer = userAnswers[idx] || '';
              const isCorrect = checkAnswer(q, answer);
              const isActive = idx === currentIndex;

              let bgColor = 'transparent';
              let borderColor = isDark ? colors.mutedForeground : colors.border; // Neutral border for untouched questions

              if (isAnswered) {
                bgColor = isCorrect ? '#10B981' : colors.destructive;
                borderColor = isCorrect ? '#10B981' : colors.destructive;
              }

              return (
                <View
                  key={idx}
                  style={[
                    styles.progressSegment,
                    {
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                      borderWidth: 1.5,
                    },
                  ]}
                />
              );
            })}
          </View>
        </TuiContainer>

        {/* Question Panel */}
        <TuiContainer label={`Question ${currentIndex + 1}`}>
          <TuiText size="lg" weight="bold" style={styles.questionText}>
            {currentQuestion.question}
          </TuiText>
        </TuiContainer>

        {/* Choices or Input */}
        <View style={styles.inputArea}>
          {currentQuestion.type === 'multiple_choice' ? (
            <View style={styles.choicesList}>
              {currentQuestion.choices.map((choice, idx) => {
                const isSelected = selectedAnswer === choice;
                const isCorrectChoice = checkAnswer(currentQuestion, choice);
                
                let optionBorder = colors.primary + '40';
                let optionBg = 'transparent';

                if (isSelected) {
                  optionBorder = colors.primary;
                  optionBg = colors.primary + '15';
                }
                if (isLocked) {
                  if (isCorrectChoice) {
                    optionBorder = '#10B981'; // Green
                    optionBg = '#10B98120';
                  } else if (isSelected) {
                    optionBorder = colors.destructive; // Red
                    optionBg = colors.destructive + '20';
                  }
                }

                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleChoicePress(choice)}
                    disabled={isLocked}
                    style={[
                      styles.choiceOption,
                      {
                        borderColor: optionBorder,
                        backgroundColor: optionBg,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioIndicator,
                        {
                          borderColor: isSelected ? colors.primary : colors.primary + '50',
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                    />
                    <TuiText style={{ flex: 1, marginLeft: 12 }}>
                      {choice}
                    </TuiText>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.identificationContainer}>
              <LetterBoxInput
                value={selectedAnswer}
                onChange={isLocked ? () => {} : (val) => {
                  const nextAnswers = [...userAnswers];
                  nextAnswers[currentIndex] = val;
                  setUserAnswers(nextAnswers);
                }}
                charCount={currentQuestion.charCount}
              />
              
              {isLocked && (
                <View style={[
                  styles.feedbackBanner,
                  {
                    borderColor: checkAnswer(currentQuestion, selectedAnswer) ? '#10B981' : colors.destructive,
                    backgroundColor: checkAnswer(currentQuestion, selectedAnswer) ? '#10B98120' : colors.destructive + '15'
                  }
                ]}>
                  <TuiText weight="bold" style={{ color: checkAnswer(currentQuestion, selectedAnswer) ? '#10B981' : colors.destructive }}>
                    {checkAnswer(currentQuestion, selectedAnswer) ? '✓ CORRECT' : currentQuestion.answer}
                  </TuiText>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer Navigation Buttons */}
        <View style={styles.footerRow}>
          <View style={styles.navButtonsRow}>
            <TuiButton
              onPress={handlePrev}
              variant="outline"
              disabled={currentIndex === 0}
              style={styles.halfBtn}
              fullWidth={false}
            >
              Previous
            </TuiButton>

            {!isLocked && selectedAnswer.trim() ? (
              <TuiButton
                onPress={handleLockIn}
                variant="accent"
                disabled={!selectedAnswer.trim()}
                style={styles.halfBtn}
                fullWidth={false}
              >
                Lock In
              </TuiButton>
            ) : (
              <TuiButton
                onPress={handleNext}
                variant={currentIndex + 1 === totalQuestions ? 'accent' : 'outline'}
                style={styles.halfBtn}
                fullWidth={false}
              >
                {currentIndex + 1 === totalQuestions ? 'Finish' : 'Next'}
              </TuiButton>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TuiButton
          onPress={handleExitPress}
          variant="destructive"
          style={styles.actionBtn}
        >
          Exit Quiz
        </TuiButton>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionText: {
    lineHeight: 24,
    marginVertical: 8,
  },
  inputArea: {
    marginVertical: 12,
    width: '100%',
  },
  choicesList: {
    width: '100%',
    gap: 10,
  },
  choiceOption: {
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  radioIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  identificationContainer: {
    width: '100%',
    alignItems: 'center',
  },
  feedbackBanner: {
    borderWidth: 1.5,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  footerRow: {
    marginTop: 20,
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    marginVertical: 4,
    width: '100%',
    paddingVertical: 16,
  },
  navButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  halfBtn: {
    flex: 1,
    marginVertical: 4,
    paddingVertical: 16,
  },
  progressOuterRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 6,
    position: 'relative',
  },
  progressSegment: {
    flex: 1,
    height: '100%',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    width: '100%',
  },
});
