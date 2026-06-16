import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import { TuiText } from './tui-text';

interface TuiCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const TuiCheckbox: React.FC<TuiCheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const getColors = () => {
    if (disabled) {
      return {
        border: isDark ? '#3F3F46' : '#A1A1AA',
        text: isDark ? '#71717A' : '#71717A',
        check: 'transparent',
      };
    }
    return {
      border: checked ? colors.primary : (isDark ? colors.primary + '30' : '#000000'),
      text: colors.foreground,
      check: colors.primary,
    };
  };

  const boxColors = getColors();

  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Brutalist checkbox bracket: [ X ] or [   ] */}
      <View
        style={[
          styles.checkboxBox,
          {
            borderColor: boxColors.border,
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          },
        ]}
      >
        <TuiText
          weight="bold"
          style={{
            color: boxColors.check,
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 16,
          }}
        >
          {checked ? 'X' : ' '}
        </TuiText>
      </View>
      
      <TuiText
        style={[
          styles.label,
          {
            color: boxColors.text,
          },
        ]}
      >
        {label}
      </TuiText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.8,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  label: {
    fontSize: 13,
  },
});
