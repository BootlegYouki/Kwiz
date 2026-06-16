import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { TuiText } from './tui-text';
import { useTheme } from '../theme/theme-provider';

interface ItemStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const ItemStepper: React.FC<ItemStepperProps> = ({
  value,
  onChange,
  min = 5,
  max = 20,
  step = 5,
  disabled = false,
}) => {
  const { colors } = useTheme();

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - step);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + step);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleDecrement}
        disabled={disabled || value <= min}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: disabled ? colors.muted : colors.primary,
            backgroundColor: pressed && !disabled ? colors.primary + '20' : 'transparent',
            opacity: disabled || value <= min ? 0.4 : 1,
          },
        ]}
      >
        <TuiText weight="bold" style={{ color: disabled ? colors.mutedForeground : colors.primary }}>
          -
        </TuiText>
      </Pressable>

      <View style={[styles.valueDisplay, { borderColor: disabled ? colors.muted : colors.primary, opacity: disabled ? 0.5 : 1 }]}>
        <TuiText weight="bold" size="lg" style={{ color: colors.foreground }}>
          {value}
        </TuiText>
      </View>

      <Pressable
        onPress={handleIncrement}
        disabled={disabled || value >= max}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: disabled ? colors.muted : colors.primary,
            backgroundColor: pressed && !disabled ? colors.primary + '20' : 'transparent',
            opacity: disabled || value >= max ? 0.4 : 1,
          },
        ]}
      >
        <TuiText weight="bold" style={{ color: disabled ? colors.mutedForeground : colors.primary }}>
          +
        </TuiText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 8,
  },
  button: {
    borderWidth: 1.5,
    height: 48,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueDisplay: {
    flex: 1,
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
