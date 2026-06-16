import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { LayoutGrid, Settings, Plus } from 'lucide-react-native';
import { useTheme } from '../theme/theme-provider';
import { TuiText } from './tui-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ScreenType = 'screen1' | 'settings' | 'action';

interface TuiTabBarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  startAnimation?: boolean;
}

let hasAnimatedNav = false;

export const TuiTabBar: React.FC<TuiTabBarProps> = ({
  currentScreen,
  onNavigate,
  startAnimation = false,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [buttonWidths, setButtonWidths] = React.useState<Record<string, number>>({});
  const [legendWidths, setLegendWidths] = React.useState<Record<string, number>>({});

  const borderAccent = colors.primary;

  const menuItems: { screen: ScreenType; label: string; Icon: React.ComponentType<any> }[] = [
    { screen: 'screen1', label: 'Home', Icon: LayoutGrid },
    { screen: 'settings', label: 'Settings', Icon: Settings },
  ];

  const isPlusActive = currentScreen === 'action';

  // Animated values using useMemo to avoid ESLint ref-render error
  const tabAnimHome = useMemo(() => new Animated.Value(hasAnimatedNav ? 1 : 0), []);
  const tabAnimSettings = useMemo(() => new Animated.Value(hasAnimatedNav ? 1 : 0), []);
  const tabAnimAdd = useMemo(() => new Animated.Value(hasAnimatedNav ? 1 : 0), []);

  React.useEffect(() => {
    if (!startAnimation || hasAnimatedNav) return;
    hasAnimatedNav = true;

    Animated.stagger(40, [
      Animated.spring(tabAnimHome, {
        toValue: 1,
        friction: 9,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(tabAnimSettings, {
        toValue: 1,
        friction: 9,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(tabAnimAdd, {
        toValue: 1,
        friction: 9,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [startAnimation]);

  const tabAnims: Record<ScreenType, Animated.Value> = {
    screen1: tabAnimHome,
    settings: tabAnimSettings,
    action: tabAnimAdd,
  };

  return (
    <View style={[styles.shadowWrapper, { bottom: insets.bottom }]}>
      <View style={styles.navRow}>
        
        {/* MENU TABS */}
        {menuItems.map((item, idx) => {
          const isActive = currentScreen === item.screen;
          const bWidth = buttonWidths[item.screen] || 70;
          const lWidth = legendWidths[item.screen] || 32;
          const topSegmentWidth = Math.max(0, (bWidth - lWidth) / 2);
          const anim = tabAnims[item.screen];

          return (
            <Animated.View
              key={item.screen}
              style={{
                flex: 1,
                marginRight: idx === menuItems.length - 1 ? 48 : 8,
                opacity: anim,
                transform: [
                  { scale: anim },
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              }}
            >
              <Pressable
                onPress={() => onNavigate(item.screen)}
                onLayout={(e) => {
                  const width = e.nativeEvent.layout.width;
                  setButtonWidths((prev) => ({ ...prev, [item.screen]: width }));
                }}
                style={[
                  styles.tabSquare,
                  {
                    backgroundColor: isActive ? (isDark ? '#27272A' : '#E4E4E7') : colors.card,
                  },
                ]}
              >
                {/* Dynamic Segmented Borders */}
                <View style={[styles.borderLeft, { backgroundColor: borderAccent }]} />
                <View style={[styles.borderRight, { backgroundColor: borderAccent }]} />
                <View style={[styles.borderBottom, { backgroundColor: borderAccent }]} />
                <View style={[styles.borderTopLeft, { backgroundColor: borderAccent, width: topSegmentWidth }]} />
                <View style={[styles.borderTopRight, { backgroundColor: borderAccent, width: topSegmentWidth }]} />

                {/* Brutalist legend resting on top border */}
                <View
                  onLayout={(e) => {
                    const width = e.nativeEvent.layout.width;
                    setLegendWidths((prev) => ({ ...prev, [item.screen]: width }));
                  }}
                  style={[
                    styles.legendWrapper,
                    {
                      backgroundColor: 'transparent',
                      paddingHorizontal: 2,
                    },
                  ]}
                >
                  <TuiText
                    weight="bold"
                    style={[
                      styles.legendText,
                      { color: isActive ? colors.primary : colors.mutedForeground },
                    ]}
                  >
                    {item.label}
                  </TuiText>
                </View>

                <View style={styles.tabContent} pointerEvents="none">
                  <item.Icon
                    size={18}
                    color={isActive ? colors.primary : colors.mutedForeground}
                  />
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* STANDALONE ACTION button */}
        <Animated.View
          style={{
            opacity: tabAnimAdd,
            transform: [
              { scale: tabAnimAdd },
              {
                translateY: tabAnimAdd.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          }}
        >
          <Pressable
            onPress={() => onNavigate('action')}
            onLayout={(e) => {
              const width = e.nativeEvent.layout.width;
              setButtonWidths((prev) => ({ ...prev, ['action']: width }));
            }}
            style={[
              styles.plusBtnSquare,
              {
                backgroundColor: isPlusActive ? (isDark ? '#27272A' : '#E4E4E7') : colors.card,
              },
            ]}
          >
            {/* Dynamic Segmented Borders */}
            <View style={[styles.borderLeft, { backgroundColor: borderAccent }]} />
            <View style={[styles.borderRight, { backgroundColor: borderAccent }]} />
            <View style={[styles.borderBottom, { backgroundColor: borderAccent }]} />
            <View
              style={[
                styles.borderTopLeft,
                {
                  backgroundColor: borderAccent,
                  width: Math.max(
                    0,
                    ((buttonWidths['action'] || 52) - (legendWidths['action'] || 24)) / 2
                  ),
                },
              ]}
            />
            <View
              style={[
                styles.borderTopRight,
                {
                  backgroundColor: borderAccent,
                  width: Math.max(
                    0,
                    ((buttonWidths['action'] || 52) - (legendWidths['action'] || 24)) / 2
                  ),
                },
              ]}
            />

            {/* Brutalist legend resting on top border */}
            <View
              onLayout={(e) => {
                const width = e.nativeEvent.layout.width;
                setLegendWidths((prev) => ({ ...prev, ['action']: width }));
              }}
              style={[
                styles.legendWrapper,
                {
                  backgroundColor: 'transparent',
                  paddingHorizontal: 2,
                },
              ]}
            >
              <TuiText
                weight="bold"
                style={[
                  styles.legendText,
                  { color: isPlusActive ? colors.primary : colors.mutedForeground },
                ]}
              >
                Add
              </TuiText>
            </View>

            <View style={styles.tabContent} pointerEvents="none">
              <Plus
                size={18}
                color={isPlusActive ? colors.primary : colors.mutedForeground}
              />
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    zIndex: 9995,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  tabSquare: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plusBtnSquare: {
    height: 52,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 1.5,
    zIndex: 5,
  },
  borderTopRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 1.5,
    zIndex: 5,
  },
  legendWrapper: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    paddingHorizontal: 2,
    zIndex: 10,
  },
  legendText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
