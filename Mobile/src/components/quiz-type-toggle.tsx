import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { TuiText } from './tui-text';
import { useTheme } from '../theme/theme-provider';
import { QuizSet } from '../types';

interface QuizTypeToggleProps {
  value: QuizSet['questionType'];
  onChange: (value: QuizSet['questionType']) => void;
  disabled?: boolean;
}

export const QuizTypeToggle: React.FC<QuizTypeToggleProps> = ({ value, onChange, disabled }) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const options: { label: string; value: QuizSet['questionType'] }[] = [
    { label: 'Multiple Choice', value: 'multiple_choice' },
    { label: 'Identification', value: 'identification' },
    { label: 'Hybrid', value: 'hybrid' },
  ];

  const currentOption = options.find((opt) => opt.value === value) || options[0];

  const handleSelect = (val: QuizSet['questionType']) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Dropdown Trigger */}
      <Pressable
        disabled={disabled}
        onPress={() => setIsOpen(!isOpen)}
        style={({ pressed }) => [
          styles.trigger,
          {
            borderColor: disabled ? colors.muted : colors.primary,
            backgroundColor: pressed && !disabled ? colors.primary + '10' : 'transparent',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <TuiText weight="bold" style={{ color: colors.foreground }}>
          {currentOption.label}
        </TuiText>
        {isOpen ? (
          <ChevronUp size={18} color={colors.primary} />
        ) : (
          <ChevronDown size={18} color={colors.primary} />
        )}
      </Pressable>

      {/* Dropdown Options List */}
      {isOpen && (
        <View
          style={[
            styles.optionsList,
            {
              borderColor: colors.primary,
              backgroundColor: colors.card,
            },
          ]}
        >
          {options.map((opt, index) => {
            const isSelected = value === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => handleSelect(opt.value)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : pressed
                      ? colors.primary + '20'
                      : 'transparent',
                    borderTopWidth: index > 0 ? 1.5 : 0,
                    borderColor: colors.primary + '40',
                  },
                ]}
              >
                <TuiText
                  weight={isSelected ? 'bold' : 'regular'}
                  style={{
                    color: isSelected ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {opt.label}
                </TuiText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 1000,
  },
  trigger: {
    borderWidth: 1.5,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  optionsList: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderTopWidth: 0,
    zIndex: 1010,
  },
  option: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
