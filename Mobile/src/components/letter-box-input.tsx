import React, { useRef } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { TuiText } from './tui-text';
import { useTheme } from '../theme/theme-provider';

interface LetterBoxInputProps {
  value: string;
  onChange: (value: string) => void;
  charCount: number;
}

export const LetterBoxInput: React.FC<LetterBoxInputProps> = ({ value, onChange, charCount }) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  // Build the boxes array
  const boxes = [];
  for (let i = 0; i < charCount; i++) {
    const char = value[i] || '';
    boxes.push(char);
  }

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Hidden input field */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          // Keep only alphanumeric and match target length
          const cleanedText = text.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, charCount);
          onChange(cleanedText);
        }}
        maxLength={charCount}
        style={styles.hiddenInput}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={true}
        keyboardType="default"
      />

      {/* Render boxes */}
      <View style={styles.boxRow}>
        {boxes.map((char, index) => {
          const isFocused = index === Math.min(value.length, charCount - 1);
          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  borderColor: isFocused ? colors.primary : colors.primary + '60',
                  backgroundColor: char ? colors.primary + '10' : 'transparent',
                },
              ]}
            >
              <TuiText
                weight="bold"
                size="lg"
                style={{
                  color: char ? colors.foreground : colors.mutedForeground,
                  textTransform: 'uppercase',
                }}
              >
                {char || '_'}
              </TuiText>
            </View>
          );
        })}
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
  boxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
