import React, { useRef } from 'react';
import { View, Pressable, TextInput, StyleSheet, Dimensions } from 'react-native';
import { TuiText } from './tui-text';
import { useTheme } from '../theme/theme-provider';

interface LetterBoxInputProps {
  value: string;
  onChange: (value: string) => void;
  charCount: number;
  correctAnswer?: string;
  isLocked?: boolean;
}

export const LetterBoxInput: React.FC<LetterBoxInputProps> = ({ value, onChange, charCount, correctAnswer, isLocked = false }) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    if (isLocked) return;
    inputRef.current?.focus();
  };

  React.useEffect(() => {
    if (isLocked) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, [correctAnswer, isLocked]);

  const screenWidth = Dimensions.get('window').width;
  const availableWidth = screenWidth - 48;

  const words = correctAnswer ? correctAnswer.split(' ') : [];
  const wordSpecs = words.length > 0 ? words : [ { length: charCount } ];
  const maxWordLength = Math.max(...wordSpecs.map(w => typeof w === 'string' ? w.length : (w.length || charCount)));
  const maxChars = correctAnswer ? correctAnswer.replace(/\s/g, '').length : charCount;

  // Compute responsive sizing
  const boxGap = maxWordLength > 10 ? 4 : 6;
  const computedW = (availableWidth - boxGap * (maxWordLength - 1)) / maxWordLength;
  const boxWidth = Math.min(36, Math.max(16, computedW));
  const boxHeight = boxWidth * 1.22;
  const fontSize = Math.min(18, Math.max(9, boxWidth * 0.5));

  const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');

  let currentCharIndex = 0;
  const wordGroups = wordSpecs.map((word, wordIdx) => {
    const wordLen = typeof word === 'string' ? word.length : (word as any).length;
    const boxes = [];
    for (let i = 0; i < wordLen; i++) {
      boxes.push({
        char: cleanValue[currentCharIndex] || '',
        globalIndex: currentCharIndex
      });
      currentCharIndex++;
    }
    
    return {
      wordIdx,
      boxes
    };
  });

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          // Keep only alphanumeric characters and spaces to allow natural keyboard IME composition
          const filtered = text.replace(/[^a-zA-Z0-9 ]/g, '');
          const lettersOnly = filtered.replace(/\s/g, '');
          if (lettersOnly.length <= maxChars) {
            onChange(filtered);
          }
        }}
        style={styles.hiddenInput}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={!isLocked}
        editable={!isLocked}
        keyboardType="default"
      />

      <View style={styles.wordGroupsContainer}>
        {wordGroups.map((group) => (
          <View key={group.wordIdx} style={[styles.wordRow, { gap: boxGap }]}>
            {group.boxes.map((box) => {
              const isFocused = box.globalIndex === Math.min(cleanValue.length, maxChars - 1);
              return (
                <View
                  key={box.globalIndex}
                  style={[
                    styles.box,
                    {
                      borderColor: isFocused ? colors.primary : colors.primary + '60',
                      backgroundColor: box.char ? colors.primary + '10' : 'transparent',
                      width: boxWidth,
                      height: boxHeight,
                    },
                  ]}
                >
                  <TuiText
                    weight="bold"
                    style={{
                      color: box.char ? colors.foreground : colors.mutedForeground,
                      textTransform: 'uppercase',
                      fontSize: fontSize,
                    }}
                  >
                    {box.char || '_'}
                  </TuiText>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  wordGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  wordRow: {
    flexDirection: 'row',
    gap: 8,
  },
  box: {
    borderWidth: 1.5,
    width: 36,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
