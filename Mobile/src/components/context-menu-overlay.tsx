import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pencil, Share, Trash2 } from 'lucide-react-native';
import { useTheme } from '../theme/theme-provider';
import { TuiText } from './tui-text';
import { QuizCard } from './quiz-card';
import { QuizSet } from '../types';

export interface ContextMenuOverlayProps {
  quiz: QuizSet;
  bounds: { x: number; y: number; width: number; height: number };
  onClose: () => void;
  onRename: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export const ContextMenuOverlay: React.FC<ContextMenuOverlayProps> = ({
  quiz,
  bounds,
  onClose,
  onRename,
  onShare,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1.0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.03,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAction = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 120,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
    });
  };

  const previewWidth = bounds.width;
  const previewHeight = bounds.height;
  const previewLeft = bounds.x;
  let previewTop = bounds.y;

  // Horizontal position of Menu centered relative to the preview
  const menuWidth = 240;
  let menuLeft = previewLeft + (previewWidth - menuWidth) / 2;
  if (menuLeft < 16) {
    menuLeft = 16;
  } else if (menuLeft + menuWidth > screenWidth - 16) {
    menuLeft = screenWidth - 16 - menuWidth;
  }

  const menuRows = [
    {
      label: 'Rename',
      action: onRename,
      icon: <Pencil size={16} color={colors.foreground} />,
    },
    {
      label: 'Share',
      action: onShare,
      icon: <Share size={16} color={colors.foreground} />,
    },
    {
      label: 'Delete',
      action: onDelete,
      icon: <Trash2 size={16} color={colors.destructive} />,
      isDestructive: true,
    },
  ];

  const menuHeight = menuRows.length * 48;
  const showBelow = (previewTop + previewHeight / 2) < (screenHeight / 2);
  const menuGap = 10;

  let menuTop = 0;
  if (showBelow) {
    menuTop = previewTop + previewHeight + menuGap;
    const overflow = (menuTop + menuHeight) - (screenHeight - insets.bottom - 16);
    if (overflow > 0) {
      previewTop -= overflow;
      menuTop -= overflow;
    }
  } else {
    menuTop = previewTop - menuHeight - menuGap;
    const overflow = (insets.top + 16) - menuTop;
    if (overflow > 0) {
      previewTop += overflow;
      menuTop += overflow;
    }
  }

  // Final safety checks for preview placement
  if (previewTop < insets.top + 16) {
    const shift = (insets.top + 16) - previewTop;
    previewTop += shift;
    menuTop += shift;
  } else if (previewTop + previewHeight > screenHeight - insets.bottom - 16) {
    const shift = (previewTop + previewHeight) - (screenHeight - insets.bottom - 16);
    previewTop -= shift;
    menuTop -= shift;
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 1500 }]}>
      {/* Backdrop */}
      <Pressable onPress={() => handleAction(onClose)} style={StyleSheet.absoluteFillObject}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: 'rgba(0,0,0,0.65)',
              opacity: opacityAnim,
            },
          ]}
        />
      </Pressable>

      {/* Preview Card (Lifts directly above original location) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: previewLeft,
            top: previewTop,
            width: previewWidth,
            height: previewHeight,
            zIndex: 1600,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <QuizCard quiz={quiz} onPress={() => {}} />
      </Animated.View>

      {/* Menu Container */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: menuLeft,
            top: menuTop,
            width: menuWidth,
            height: menuHeight,
            zIndex: 1700,
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            overflow: 'hidden',
          },
        ]}
      >
        {menuRows.map((row, index) => {
          const isLast = index === menuRows.length - 1;
          return (
            <Pressable
              key={row.label}
              onPress={() => handleAction(row.action)}
              style={({ pressed }) => [
                styles.menuRow,
                {
                  backgroundColor: pressed
                    ? (row.isDestructive ? colors.destructive + '15' : colors.primary + '15')
                    : 'transparent',
                  borderBottomWidth: isLast ? 0 : 1.5,
                  borderBottomColor: colors.primary + '20',
                },
              ]}
            >
              <TuiText
                size="sm"
                weight="bold"
                style={{
                  color: row.isDestructive ? colors.destructive : colors.foreground,
                }}
              >
                {row.label}
              </TuiText>
              {row.icon}
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  menuRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});
