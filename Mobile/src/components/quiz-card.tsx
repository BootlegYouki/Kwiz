import React, { useRef, useEffect } from 'react';
import { Pressable, View, StyleSheet, Animated } from 'react-native';
import { TuiContainer } from './tui-container';
import { TuiText } from './tui-text';
import { QuizSet } from '../types';
import { useTheme } from '../theme/theme-provider';

interface QuizCardProps {
  quiz: QuizSet;
  onPress: () => void;
  onLongPress?: (bounds: { x: number; y: number; width: number; height: number }) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onPress, onLongPress }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (quiz.status === 'generating') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [quiz.status, pulseAnim]);

  const skeletonOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.65],
  });

  const getBadgeText = () => {
    if (quiz.status === 'generating') return 'Generating';
    if (quiz.status === 'error') return 'Error';
    
    switch (quiz.questionType) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'identification':
        return 'Identification';
      case 'hybrid':
        return 'Hybrid';
      default:
        return 'Ready';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.03,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const handleLongPress = () => {
    if (!onLongPress) return;
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      onLongPress({ x: pageX, y: pageY, width, height });
    });
  };

  return (
    <Animated.View 
      ref={containerRef}
      style={{ transform: [{ scale: scaleAnim }], width: '100%' }}
    >
      <Pressable 
        disabled={quiz.status === 'generating'} 
        onPress={onPress} 
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={500}
        style={styles.cardPressable}
      >
        {({ pressed }) => (
          <TuiContainer 
            label={formatDate(quiz.createdAt)} 
            accentBorder={quiz.status === 'generating'}
          >
            <View style={styles.cardBody}>
              {quiz.status === 'generating' ? (
                <Animated.View style={[styles.contentRow, { opacity: skeletonOpacity }]}>
                  {/* Left side details skeleton */}
                  <View style={styles.leftContent}>
                    <TuiText size="lg" weight="bold" style={{ color: colors.foreground }}>
                      ████████████████
                    </TuiText>
                    <TuiText size="xs" style={{ color: colors.primary, marginTop: 8 }}>
                      ████████
                    </TuiText>
                  </View>

                  {/* Right side item count skeleton */}
                  <View style={[styles.rightContent, { borderLeftColor: colors.primary + '30' }]}>
                    <TuiText size="2xl" weight="bold" style={{ color: colors.primary }}>
                      ██
                    </TuiText>
                  </View>
                </Animated.View>
              ) : (
                <View style={styles.contentRow}>
                  {/* Left side details */}
                  <View style={styles.leftContent}>
                    <TuiText size="lg" weight="bold" style={{ color: colors.foreground }}>
                      {quiz.title}
                    </TuiText>
                    {quiz.fileName && (
                      <TuiText size="xs" style={{ color: colors.mutedForeground, marginTop: 6 }}>
                        FILE: <TuiText size="xs" weight="bold" style={{ color: colors.primary }}>{quiz.fileName}</TuiText>
                      </TuiText>
                    )}
                  </View>

                  {/* Right side big items count */}
                  <View style={[styles.rightContent, { borderLeftColor: colors.primary + '30' }]}>
                    <TuiText size="2xl" weight="bold" style={{ color: colors.primary }}>
                      {quiz.questions.length.toString().padStart(2, '0')}
                    </TuiText>
                    <TuiText size="xs" style={{ color: colors.mutedForeground, marginTop: -2 }}>
                      ITEMS
                    </TuiText>
                  </View>
                </View>
              )}
            </View>
          </TuiContainer>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardPressable: {
    width: '100%',
    marginBottom: 8,
  },
  cardBody: {
    paddingVertical: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftContent: {
    flex: 1,
    paddingRight: 16,
  },
  rightContent: {
    borderLeftWidth: 1.5,
    paddingLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
