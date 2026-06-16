import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Keyboard } from 'react-native';
import { TuiContainer } from '../components/tui-container';
import { TuiText } from '../components/tui-text';
import { TuiButton } from '../components/tui-button';
import { LetterBoxInput } from '../components/letter-box-input';
import { QuizSet, QuizQuestion } from '../types';
import { useTheme } from '../theme/theme-provider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface QuizPlayerScreenProps {
  quiz: QuizSet;
  onFinish: (score: number, answers: string[], finalQueue?: QuizQuestion[]) => void;
  onExit: () => void;
}

export const QuizPlayerScreen: React.FC<QuizPlayerScreenProps> = ({ quiz, onFinish, onExit }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [questionQueue, setQuestionQueue] = useState<QuizQuestion[]>(quiz.questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalQuestions = questionQueue.length;

  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(quiz.questions.length).fill(''));
  const [lockedStates, setLockedStates] = useState<boolean[]>(new Array(quiz.questions.length).fill(false));

  const currentQuestion: QuizQuestion = questionQueue[currentIndex];
  const selectedAnswer = userAnswers[currentIndex] || '';
  const isLocked = lockedStates[currentIndex] || false;

  const handleChoicePress = (choice: string) => {
    if (isLocked) return;
    handleLockIn(choice);
  };

  const handleLockIn = (overrideValue?: string) => {
    const ans = overrideValue !== undefined ? overrideValue : selectedAnswer;
    const nextLocked = [...lockedStates];
    nextLocked[currentIndex] = true;

    const isCorrect = checkAnswer(currentQuestion, ans);
    if (!isCorrect) {
      const nextQueue = [...questionQueue, currentQuestion];
      const nextAnswers = [...userAnswers];
      nextAnswers[currentIndex] = ans;
      const nextLockedQueue = [...nextLocked];
      
      nextAnswers.push('');
      nextLockedQueue.push(false);

      setQuestionQueue(nextQueue);
      setUserAnswers(nextAnswers);
      setLockedStates(nextLockedQueue);
    } else {
      const nextAnswers = [...userAnswers];
      nextAnswers[currentIndex] = ans;
      setUserAnswers(nextAnswers);
      setLockedStates(nextLocked);
    }

    Keyboard.dismiss();
  };

  const checkAnswer = (question: QuizQuestion, answerStr: string): boolean => {
    if (!answerStr) return false;
    const normalizedAnswer = answerStr.toLowerCase().replace(/\s/g, '');
    const correctAnswer = question.answer.toLowerCase().replace(/\s/g, '');

    if (normalizedAnswer === correctAnswer) return true;

    if (question.type === 'multiple_choice' && question.choices) {
      const letterMap = ['a', 'b', 'c', 'd'];
      const ansIdx = letterMap.indexOf(correctAnswer);
      if (ansIdx !== -1 && question.choices[ansIdx]) {
        const correctChoiceText = question.choices[ansIdx].toLowerCase().replace(/\s/g, '');
        if (normalizedAnswer === correctChoiceText) {
          return true;
        }
      }
    }
    return false;
  };

  const handlePrev = () => {
    let targetIndex = currentIndex - 1;
    while (targetIndex >= 0) {
      const q = questionQueue[targetIndex];
      let alreadyCorrect = false;
      for (let i = 0; i < questionQueue.length; i++) {
        if (questionQueue[i] === q && lockedStates[i]) {
          if (checkAnswer(questionQueue[i], userAnswers[i])) {
            alreadyCorrect = true;
            break;
          }
        }
      }
      if (!alreadyCorrect) {
        break;
      }
      targetIndex--;
    }

    if (targetIndex >= 0) {
      setCurrentIndex(targetIndex);
    }
  };

  const handleNext = () => {
    if (!isLocked) {
      handleLockIn();
      return;
    }

    let targetIndex = currentIndex + 1;
    while (targetIndex < questionQueue.length) {
      const q = questionQueue[targetIndex];
      let alreadyCorrect = false;
      for (let i = 0; i < questionQueue.length; i++) {
        if (questionQueue[i] === q && lockedStates[i]) {
          if (checkAnswer(questionQueue[i], userAnswers[i])) {
            alreadyCorrect = true;
            break;
          }
        }
      }
      if (!alreadyCorrect) {
        break;
      }
      targetIndex++;
    }

    if (targetIndex < questionQueue.length) {
      setCurrentIndex(targetIndex);
    } else {
      let finalScore = 0;
      quiz.questions.forEach((q, idx) => {
        if (checkAnswer(q, userAnswers[idx])) {
          finalScore += 1;
        }
      });
      onFinish(finalScore, userAnswers, questionQueue);
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

  const currentOriginalIndex = quiz.questions.indexOf(currentQuestion);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Segmented Retro Progress Bar */}
        <TuiContainer label={`Question ${currentOriginalIndex !== -1 ? currentOriginalIndex + 1 : 1} / ${quiz.questions.length}`}>
          <View style={[styles.progressOuterRow, { height: 30 }]}>
            {quiz.questions.map((q, origIdx) => {
              // Find the latest attempt for this question in the queue
              let latestAttemptIdx = -1;
              for (let i = questionQueue.length - 1; i >= 0; i--) {
                if (questionQueue[i] === q && lockedStates[i]) {
                  latestAttemptIdx = i;
                  break;
                }
              }

              const isAnswered = latestAttemptIdx !== -1;
              const answer = isAnswered ? userAnswers[latestAttemptIdx] : '';
              const isCorrect = isAnswered && checkAnswer(q, answer);
              
              // Is this original question the one currently active?
              const isActive = currentQuestion === q;

              let bgColor = 'transparent';
              let borderColor = isDark ? colors.mutedForeground : colors.border; // Neutral border for untouched questions

              if (isAnswered) {
                bgColor = isCorrect ? '#10B981' : colors.destructive;
                borderColor = isCorrect ? '#10B981' : colors.destructive;
              }

              if (isActive) {
                borderColor = colors.primary;
              }

              return (
                <View
                  key={origIdx}
                  style={[
                    styles.progressSegment,
                    {
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                      borderWidth: isActive ? 2.5 : 1.5,
                    },
                  ]}
                />
              );
            })}
          </View>
        </TuiContainer>

        {/* Question Panel */}
        <TuiContainer label={`Question ${currentOriginalIndex !== -1 ? currentOriginalIndex + 1 : 1}`}>
          <TuiText size="md" weight="bold" style={styles.questionText}>
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
                    <TuiText size="sm" style={{ flex: 1, marginLeft: 12 }}>
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
                onChange={isLocked ? () => { } : (val) => {
                  const nextAnswers = [...userAnswers];
                  nextAnswers[currentIndex] = val;
                  setUserAnswers(nextAnswers);
                  const lettersOnly = val.replace(/[^a-zA-Z0-9]/g, '');
                  const expectedChars = currentQuestion.answer ? currentQuestion.answer.replace(/\s/g, '').length : currentQuestion.charCount;
                  if (expectedChars && lettersOnly.length === expectedChars) {
                    handleLockIn(val);
                  }
                }}
                charCount={currentQuestion.charCount}
                correctAnswer={currentQuestion.answer}
                isLocked={isLocked}
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

      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={[styles.navButtonsRow, { marginBottom: 8 }]}>
          <TuiButton
            onPress={handlePrev}
            variant="outline"
            disabled={currentIndex === 0}
            style={styles.halfBtn}
            fullWidth={false}
          >
            Previous
          </TuiButton>

          <TuiButton
            onPress={handleNext}
            variant={currentIndex + 1 === totalQuestions ? 'accent' : 'outline'}
            style={styles.halfBtn}
            fullWidth={false}
          >
            {currentIndex + 1 === totalQuestions ? 'Finish' : 'Next'}
          </TuiButton>
        </View>

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
