import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import { TuiText } from './tui-text';
import { TuiRetroBorders } from './tui-retro-borders';

interface TuiContainerProps {
  children: React.ReactNode;
  label: string;
  badge?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  accentBorder?: boolean;
  onBadgePress?: () => void;
  labelSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  borderColor?: string;
}

export const TuiContainer: React.FC<TuiContainerProps> = ({
  children,
  label,
  badge,
  style,
  contentStyle,
  accentBorder = false,
  onBadgePress,
  labelSize = 'md',
  borderColor,
}) => {
  const { colors, isDark } = useTheme();
  const [legendWidth, setLegendWidth] = React.useState(0);

  // Brutalist double-line border style, or clean solid border
  const finalBorderColor = borderColor || (accentBorder ? colors.primary : (isDark ? colors.mutedForeground : colors.border));
  const labelColor = borderColor || (accentBorder ? colors.primary : colors.foreground);
  const backgroundColor = colors.card;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor,
        },
        style,
      ]}
    >
      {/* Custom Segmented Borders */}
      <TuiRetroBorders borderColor={finalBorderColor} legendWidth={legendWidth} />

      {/* Legend Container */}
      <View
        onLayout={(e) => setLegendWidth(e.nativeEvent.layout.width)}
        style={[
          styles.legendWrapper,
          {
            backgroundColor: 'transparent',
          },
        ]}
      >
        <TuiText weight="bold" size={labelSize} style={{ color: labelColor }}>
          {label}
        </TuiText>
        {badge && (
          <Pressable
            disabled={!onBadgePress}
            onPress={onBadgePress}
            style={({ pressed }) => [
              styles.badgeContainer,
              {
                borderColor: finalBorderColor,
                backgroundColor: pressed 
                  ? finalBorderColor + '30' 
                  : (isDark ? finalBorderColor + '15' : finalBorderColor + '10'),
              },
            ]}
          >
            <TuiText size="sm" weight="bold" style={{ color: finalBorderColor }}>
              {badge}
            </TuiText>
          </Pressable>
        )}
      </View>

      {/* Main Content */}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginTop: 10,
    marginBottom: 6,
    padding: 8,
    paddingTop: 12,
    paddingHorizontal: 12,
    width: '100%',
    position: 'relative',
  },
  borderLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    zIndex: 5,
  },
  borderRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    zIndex: 5,
  },
  borderBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
    zIndex: 5,
  },
  borderTopLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 12,
    height: 1.5,
    zIndex: 5,
  },
  borderTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 1.5,
    zIndex: 5,
  },
  legendWrapper: {
    position: 'absolute',
    top: -11,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    zIndex: 10,
  },
  badgeContainer: {
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  content: {
    width: '100%',
  },
});

