import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme-provider';
import { TuiContainer } from '../components/tui-container';
import { TuiText } from '../components/tui-text';
import { TuiButton } from '../components/tui-button';

interface SettingsScreenProps {}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { colors, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
      >
        {/* System Color Theme Preferences */}
        <TuiContainer label="System Preferences">
          <TuiText size="sm" style={styles.preferenceLabel}>
            Select app color theme:
          </TuiText>
          <View style={styles.segmentsRow}>
            <View style={styles.segmentCol}>
              <TuiButton
                onPress={() => setThemeMode('dark')}
                variant={isDark ? 'accent' : 'outline'}
                style={styles.preferenceBtn}
              >
                Dark Mode
              </TuiButton>
            </View>
            <View style={styles.segmentCol}>
              <TuiButton
                onPress={() => setThemeMode('light')}
                variant={!isDark ? 'accent' : 'outline'}
                style={styles.preferenceBtn}
              >
                Light Mode
              </TuiButton>
            </View>
          </View>
        </TuiContainer>

        {/* Google Drive Synchronization Settings */}
        <TuiContainer label="Connect to Cloud" style={styles.containerMargin}>
          <View style={styles.disconnectedCard}>
            <TuiText size="sm" style={styles.infoText}>
              Link Google Drive to back up your quizzes and study notes automatically.
            </TuiText>
            <TuiButton
              onPress={() => {}}
              variant="outline"
              style={styles.linkBtn}
              disabled={true}
            >
              Connect Google Drive (Phase 3)
            </TuiButton>
          </View>
        </TuiContainer>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  containerMargin: {
    marginTop: 18,
  },
  preferenceLabel: {
    marginBottom: 8,
  },
  segmentsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  segmentCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  preferenceBtn: {
    marginVertical: 4,
    height: 44,
    justifyContent: 'center',
    paddingVertical: 0,
  },
  disconnectedCard: {
    paddingVertical: 8,
  },
  infoText: {
    marginBottom: 16,
    lineHeight: 18,
  },
  linkBtn: {
    height: 44,
    justifyContent: 'center',
    paddingVertical: 0,
  },
});
