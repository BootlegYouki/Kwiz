import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme-provider';
import { TuiContainer } from '../components/tui-container';
import { TuiText } from '../components/tui-text';
import { TuiButton } from '../components/tui-button';
import { TuiInput } from '../components/tui-input';

const API_KEY_STORAGE_KEY = 'kwiz_mistral_api_key';

interface SettingsScreenProps {}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { colors, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(API_KEY_STORAGE_KEY).then(val => {
      if (val) setApiKey(val);
    });
  }, []);

  const handleSave = async () => {
    await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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

        {/* Mistral API Config */}
        <TuiContainer label="Mistral AI" style={styles.containerMargin}>
          <TuiText size="sm" style={styles.infoText}>
            Enter your Mistral API key to enable AI quiz generation from your documents.
          </TuiText>
          <TuiInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your Mistral API key..."
            secureTextEntry={true}
            showSecureToggle={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TuiButton
            onPress={handleSave}
            variant="accent"
            style={styles.saveBtn}
          >
            {saved ? 'Saved!' : 'Save API Key'}
          </TuiButton>
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
  infoText: {
    marginBottom: 16,
    lineHeight: 18,
  },
  saveBtn: {
    height: 44,
    justifyContent: 'center',
    paddingVertical: 0,
  },
});
