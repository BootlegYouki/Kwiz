import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import { ThemeProvider, useTheme } from './src/theme/theme-provider';
import { TuiTabBar, ScreenType } from './src/components/tui-nav';
import { TuiText } from './src/components/tui-text';
import { TuiContainer } from './src/components/tui-container';
import { TuiButton } from './src/components/tui-button';
import { TuiInput } from './src/components/tui-input';
import { TuiCheckbox } from './src/components/tui-checkbox';
import { TuiSwitch } from './src/components/tui-switch';
import { TuiDrawer } from './src/components/tui-drawer';
import { TuiCalendar } from './src/components/tui-calendar';
import { TuiSkeletonLoader } from './src/components/tui-skeleton';
import { SplashIcon } from './src/components/splash-icon';
import { TuiHeader } from './src/components/tui-header';
import { Terminal } from 'lucide-react-native';



function MainApp() {
  const { colors, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeScreen, setActiveScreen] = useState<ScreenType>('screen1');

  // Input states
  const [textVal, setTextVal] = useState('');
  const [checkedVal, setCheckedVal] = useState(false);

  // Drawer & Calendar states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('06-03-2026');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Skeleton state
  const [loadingSkeleton, setLoadingSkeleton] = useState(false);

  // Splash screen states
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // Simulate initial data loading delay for a premium boot feel
  useEffect(() => {
    const timer = setTimeout(() => {
      setDataLoaded(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Set app ready once data is loaded
  useEffect(() => {
    if (dataLoaded) {
      setIsAppReady(true);
    }
  }, [dataLoaded]);

  // Fade out internal TUI splash screen
  useEffect(() => {
    if (isAppReady) {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSplashVisible(false);
      });
    }
  }, [isAppReady]);

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const handleNavigate = (screen: ScreenType) => {
    if (screen === 'action') {
      setDrawerOpen(true);
    } else {
      setActiveScreen(screen);
    }
  };

  // Full loading skeleton simulation
  if (loadingSkeleton) {
    return <TuiSkeletonLoader />;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Sticky TUI Header */}
        <TuiHeader
          title="TUI NATIVE"
          subtitle={activeScreen}
          Icon={Terminal}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        >
          {activeScreen === 'screen1' && (
            <View style={styles.tabContent}>
              <TuiContainer label="Welcome" badge="Screen 1">
                <TuiText style={{ marginBottom: 12 }}>
                  This is a clean, modular starter template utilizing a brutalist Terminal User Interface (TUI) design system.
                </TuiText>
                <TuiText style={{ marginBottom: 16 }}>
                  All basic components have been styled using borders, hard drop shadows, and high contrast layouts.
                </TuiText>
                <TuiButton onPress={toggleTheme} variant="accent">
                  Toggle Theme Mode
                </TuiButton>
              </TuiContainer>

              <TuiContainer label="TUI Buttons" style={styles.marginGap}>
                <View style={styles.buttonGrid}>
                  <TuiButton onPress={() => {}} variant="default" style={styles.gridItem}>
                    Default
                  </TuiButton>
                  <TuiButton onPress={() => {}} variant="accent" style={styles.gridItem}>
                    Accent
                  </TuiButton>
                  <TuiButton onPress={() => {}} variant="outline" style={styles.gridItem}>
                    Outline
                  </TuiButton>
                  <TuiButton onPress={() => {}} variant="destructive" style={styles.gridItem}>
                    Destruct
                  </TuiButton>
                </View>
              </TuiContainer>
            </View>
          )}

          {activeScreen === 'screen2' && (
            <View style={styles.tabContent}>
              <TuiContainer label="Form Controls" badge="Screen 2">
                <TuiInput
                  label="Brutalist Input"
                  placeholder="Type something..."
                  value={textVal}
                  onChangeText={setTextVal}
                  style={{ marginBottom: 16 }}
                />
                <View style={{ marginBottom: 16 }}>
                  <TuiSwitch
                    label="TUI Toggle Switch"
                    value={isDark}
                    onValueChange={toggleTheme}
                  />
                </View>
                <TuiCheckbox
                  label="Accept Terms & Conditions"
                  checked={checkedVal}
                  onChange={setCheckedVal}
                />
              </TuiContainer>
            </View>
          )}

          {activeScreen === 'screen3' && (
            <View style={styles.tabContent}>
              <TuiContainer label="Skeleton Loaders" badge="Screen 3">
                <TuiText style={{ marginBottom: 16 }}>
                  Press the button to simulate and preview brutalist loading placeholders for 2 seconds.
                </TuiText>
                <TuiButton
                  onPress={() => {
                    setLoadingSkeleton(true);
                    setTimeout(() => setLoadingSkeleton(false), 2000);
                  }}
                  variant="accent"
                >
                  Trigger Skeleton
                </TuiButton>
              </TuiContainer>
            </View>
          )}

          {activeScreen === 'screen4' && (
            <View style={styles.tabContent}>
              <TuiContainer label="Calendar & Picking" badge="Screen 4">
                <TuiText style={{ marginBottom: 16 }}>
                  Selected Date: <TuiText weight="bold">{selectedDate}</TuiText>
                </TuiText>
                <TuiButton onPress={() => setShowDatePicker(true)} variant="outline">
                  Open TUI Calendar
                </TuiButton>
              </TuiContainer>
            </View>
          )}
        </ScrollView>

        {/* TUI Calendar Modal Overlay */}
        {showDatePicker && (
          <View style={styles.calendarModalOverlay}>
            <TuiContainer label="Select Date" badge="Calendar" style={styles.calendarModalContent}>
              <TuiCalendar
                value={selectedDate}
                onChange={(date: string) => {
                  setSelectedDate(date);
                  setShowDatePicker(false);
                }}
              />
              <TuiButton onPress={() => setShowDatePicker(false)} variant="outline" style={{ marginTop: 12 }}>
                Close
              </TuiButton>
            </TuiContainer>
          </View>
        )}

        {/* Add Drawer Modal (Standalone Plus) */}
        <TuiDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Add Action"
        >
          <TuiContainer label="New Entry" style={{ borderBottomWidth: 0 }}>
            <TuiText style={{ marginBottom: 16 }}>
              This drawer was popped up by pressing the navigation's center Action button.
            </TuiText>
            <TuiButton onPress={() => setDrawerOpen(false)} variant="accent">
              Confirm Entry
            </TuiButton>
          </TuiContainer>
        </TuiDrawer>

        {/* Tab Navigation */}
        <TuiTabBar
          currentScreen={activeScreen}
          onNavigate={handleNavigate}
          startAnimation={true}
        />
      </SafeAreaView>

      {/* Internal animated TUI splash screen overlay */}
      {splashVisible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? '#121212' : '#F4F4F5',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: splashOpacity,
              zIndex: 99999,
            },
          ]}
          pointerEvents="none"
        >
          <SplashIcon color={colors.primary} size={140} />
        </Animated.View>
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  tabContent: {
    width: '100%',
  },
  marginGap: {
    marginTop: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: Platform.OS === 'web' ? '22%' : '47%',
  },
  calendarModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  calendarModalContent: {
    width: '100%',
    maxWidth: 360,
  },
});
