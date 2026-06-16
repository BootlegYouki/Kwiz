import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import { TuiText } from './tui-text';

interface TuiSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const TuiSwitch: React.FC<TuiSwitchProps> = ({
  label,
  value,
  onValueChange,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();

  const handleToggle = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const activeColor = colors.primary;
  const inactiveColor = isDark ? '#3F3F46' : '#A1A1AA';
  const borderColor = disabled
    ? (isDark ? '#27272A' : '#E4E4E7')
    : (isDark ? colors.primary + '40' : '#000000');

  return (
    <Pressable
      disabled={disabled}
      onPress={handleToggle}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <TuiText style={styles.label}>{label}</TuiText>

      {/* Terminal styling switch box: [ ON | off ] or [ on | OFF ] */}
      <View
        style={[
          styles.switchBox,
          {
            borderColor,
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          },
        ]}
      >
        {/* ON indicator */}
        <View
          style={[
            styles.switchSide,
            value && {
              backgroundColor: activeColor,
            },
          ]}
        >
          <TuiText
            weight="bold"
            size="xs"
            style={{
              color: value ? colors.primaryForeground : inactiveColor,
              textAlign: 'center',
            }}
          >
            ON
          </TuiText>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        {/* OFF indicator */}
        <View
          style={[
            styles.switchSide,
            !value && {
              backgroundColor: isDark ? '#3F3F46' : '#E4E4E7',
            },
          ]}
        >
          <TuiText
            weight="bold"
            size="xs"
            style={{
              color: !value ? (isDark ? '#FAFAFA' : '#09090B') : inactiveColor,
              textAlign: 'center',
            }}
          >
            OFF
          </TuiText>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    paddingVertical: 4,
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 13,
  },
  switchBox: {
    flexDirection: 'row',
    borderWidth: 1.5,
    width: 90,
    height: 28,
    alignItems: 'center',
  },
  switchSide: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 2,
    height: '100%',
  },
});
