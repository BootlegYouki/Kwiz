import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ScrollView, Pressable, Share, Alert, Modal } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import { ThemeProvider, useTheme } from './src/theme/theme-provider';

import { TuiHeader } from './src/components/tui-header';
import { TuiText } from './src/components/tui-text';
import { TuiButton } from './src/components/tui-button';
import { TuiDrawer } from './src/components/tui-drawer';
import { TuiInput } from './src/components/tui-input';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { Settings, Plus } from 'lucide-react-native';
import { KwizIcon } from './src/components/kwiz-icon';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Screens & components
import { HomeScreen } from './src/screens/HomeScreen';
import { QuizPlayerScreen } from './src/screens/QuizPlayerScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NewQuizDrawer } from './src/components/new-quiz-drawer';
import { QuizCard } from './src/components/quiz-card';
import { ContextMenuOverlay } from './src/components/context-menu-overlay';
import { QuizSet, QuizQuestion } from './src/types';
import { getQuizzes, saveQuizzes, saveQuiz, deleteQuiz, renameQuiz } from './src/utils/quiz-storage';

function MainApp() {
  const { colors, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  // Navigation states
  const [activeTab, setActiveTab] = useState<'screen1' | 'settings'>('screen1'); // screen1 = Quizzes
  const [gamePlayState, setGamePlayState] = useState<'idle' | 'playing' | 'results'>('idle');

  // Active quiz states
  const [quizzes, setQuizzes] = useState<QuizSet[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizSet | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameAnswers, setGameAnswers] = useState<string[]>([]);

  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedQuizForMenu, setSelectedQuizForMenu] = useState<{ quiz: QuizSet; bounds: { x: number; y: number; width: number; height: number } } | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newQuizName, setNewQuizName] = useState('');

  // Splash screen states
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  // Load quizzes initially
  useEffect(() => {
    async function loadData() {
      const stored = await getQuizzes();
      setQuizzes(stored);
      setDataLoaded(true);
    }
    loadData();
  }, []);

  // Deep link / custom file scheme listener for .kwiz files
  useEffect(() => {
    const handleIncomingFile = async (url: string) => {
      try {
        const decodedUrl = decodeURIComponent(url);
        // Deep link file URIs start with file:// or content://
        if (!decodedUrl.endsWith('.kwiz') && !decodedUrl.includes('.kwiz')) return;
        
        const content = await FileSystem.readAsStringAsync(decodedUrl);
        const importedQuiz = JSON.parse(content);
        
        if (importedQuiz && importedQuiz.title && Array.isArray(importedQuiz.questions)) {
          importedQuiz.id = Math.random().toString(36).substring(7);
          importedQuiz.createdAt = new Date().toISOString();
          importedQuiz.status = 'ready';
          
          await saveQuiz(importedQuiz);
          const reloaded = await getQuizzes();
          setQuizzes(reloaded);
          Alert.alert('Quiz Imported', `Successfully imported "${importedQuiz.title}"!`);
        } else {
          Alert.alert('Import Error', 'Invalid quiz file format.');
        }
      } catch (err) {
        console.error('Failed to import quiz from deep link', err);
        Alert.alert('Import Error', 'Failed to read or parse the quiz file.');
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingFile(url);
    });

    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url) handleIncomingFile(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Set app ready once data is loaded
  useEffect(() => {
    if (dataLoaded) {
      setIsAppReady(true);
    }
  }, [dataLoaded]);

  // Hide native splash screen
  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isAppReady]);

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const handleTabNavigate = (screen: ScreenType) => {
    if (screen === 'action') {
      setDrawerOpen(true);
    } else if (screen === 'screen1') {
      setActiveTab('screen1');
    } else if (screen === 'settings') {
      setActiveTab('settings');
    }
  };

  // Mock LLM generation logic
  const handleCreateQuiz = async (config: {
    questionType: QuizSet['questionType'];
    count: number;
    customPrompt: string;
    attachment: { name: string; uri: string } | null;
  }) => {
    // Check if the attached file is a .kwiz file
    if (config.attachment && config.attachment.name.endsWith('.kwiz')) {
      try {
        const content = await FileSystem.readAsStringAsync(config.attachment.uri);
        const importedQuiz = JSON.parse(content);
        if (importedQuiz && importedQuiz.title && Array.isArray(importedQuiz.questions)) {
          importedQuiz.id = Math.random().toString(36).substring(7);
          importedQuiz.createdAt = new Date().toISOString();
          importedQuiz.status = 'ready';
          
          await saveQuiz(importedQuiz);
          const reloaded = await getQuizzes();
          setQuizzes(reloaded);
          Alert.alert('Success', `Imported quiz "${importedQuiz.title}" successfully!`);
          return;
        }
      } catch (err) {
        console.error('Failed to import attached .kwiz file', err);
        Alert.alert('Import Error', 'Failed to parse the attached .kwiz file.');
        return;
      }
    }
    const quizId = Math.random().toString(36).substring(7);
    const newQuizTitle = config.attachment
      ? config.attachment.name.replace(/\.[^/.]+$/, "")
      : config.customPrompt
      ? `${config.customPrompt.substring(0, 20)}...`
      : 'General Quiz';

    const tempQuiz: QuizSet = {
      id: quizId,
      title: newQuizTitle,
      createdAt: new Date().toISOString(),
      questionType: config.questionType,
      questions: [],
      source: config.attachment ? 'attachment' : 'prompt',
      fileName: config.attachment?.name,
      status: 'generating',
    };

    // Optimistically update list
    const updatedQuizzes = [tempQuiz, ...quizzes];
    setQuizzes(updatedQuizzes);
    await saveQuizzes(updatedQuizzes);

    // Simulate PC background generation (Tauri backend emulation for Phase 1)
    setTimeout(async () => {
      // Mock generated questions based on type
      const generatedQuestions: QuizQuestion[] = [];
      const countToGenerate = config.count;

      for (let i = 1; i <= countToGenerate; i++) {
        const isIdentification =
          config.questionType === 'identification' ||
          (config.questionType === 'hybrid' && i % 2 === 0);

        if (isIdentification) {
          generatedQuestions.push({
            type: 'identification',
            question: `Identification question ${i} derived from ${config.attachment ? config.attachment.name : 'your notes'}. (Answer is "kwiz")`,
            answer: 'kwiz',
            charCount: 4,
          });
        } else {
          generatedQuestions.push({
            type: 'multiple_choice',
            question: `Multiple choice question ${i} generated from content.`,
            choices: [`Choice A for item ${i}`, `Choice B for item ${i}`, `Choice C for item ${i}`, `Choice D for item ${i}`],
            answer: `Choice B for item ${i}`,
          });
        }
      }

      const finalizedQuiz: QuizSet = {
        ...tempQuiz,
        status: 'ready',
        questions: generatedQuestions,
      };

      // Update storage and state
      await saveQuiz(finalizedQuiz);
      const reloaded = await getQuizzes();
      setQuizzes(reloaded);
    }, 3000);
  };

  const handleSelectQuiz = (quiz: QuizSet) => {
    setActiveQuiz(quiz);
    setGamePlayState('playing');
  };

  const handleFinishQuiz = (score: number, answers: string[]) => {
    setGameScore(score);
    setGameAnswers(answers);
    setGamePlayState('results');
  };

  const handleExitQuiz = () => {
    setActiveQuiz(null);
    setGamePlayState('idle');
  };

  const handleBackToMenu = () => {
    setActiveQuiz(null);
    setGamePlayState('idle');
  };

  const handleLongPressQuiz = (quiz: QuizSet, bounds: { x: number; y: number; width: number; height: number }) => {
    setSelectedQuizForMenu({ quiz, bounds });
  };

  const handleShareQuiz = async (quiz: QuizSet) => {
    try {
      // Write quiz content to a temporary file
      const sanitizedTitle = quiz.title.replace(/[^a-z0-9]/gi, '_');
      const fileUri = `${FileSystem.cacheDirectory}${sanitizedTitle}.kwiz`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(quiz));
      
      // Share file natively
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/octet-stream',
        dialogTitle: `Share ${quiz.title}`,
        UTI: 'com.bootlegyouki.kwiz',
      });
    } catch (err) {
      console.error('Failed to share quiz', err);
      Alert.alert('Share Error', 'Failed to share the quiz file.');
    }
  };

  const handleRenameQuiz = async (id: string, newTitle: string) => {
    await renameQuiz(id, newTitle);
    const reloaded = await getQuizzes();
    setQuizzes(reloaded);
  };

  const handleDeleteQuizConfirm = (quiz: QuizSet) => {
    Alert.alert(
      'Delete Quiz',
      `Are you sure you want to delete "${quiz.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteQuiz(quiz.id);
            const reloaded = await getQuizzes();
            setQuizzes(reloaded);
            setSelectedQuizForMenu(null);
          },
        },
      ]
    );
  };

  const renderActiveScreen = () => {
    if (gamePlayState === 'playing' && activeQuiz) {
      return (
        <QuizPlayerScreen
          quiz={activeQuiz}
          onFinish={handleFinishQuiz}
          onExit={handleExitQuiz}
        />
      );
    }

    if (gamePlayState === 'results' && activeQuiz) {
      return (
        <ResultsScreen
          quiz={activeQuiz}
          score={gameScore}
          answers={gameAnswers}
          onBackToMenu={handleBackToMenu}
          onRetake={() => setGamePlayState('playing')}
        />
      );
    }

    if (activeTab === 'screen1') {
      return (
        <HomeScreen
          quizzes={quizzes}
          onSelectQuiz={handleSelectQuiz}
          onLongPressQuiz={handleLongPressQuiz}
        />
      );
    }

    if (activeTab === 'settings') {
      return <SettingsScreen />;
    }

    return null;
  };

  const getHeaderSubtitle = () => {
    if (gamePlayState === 'playing' && activeQuiz) return activeQuiz.title;
    if (gamePlayState === 'results' && activeQuiz) return activeQuiz.title;
    return 'by BootlegYouki';
  };

  const headerRight = (
    <View style={styles.headerActionsContainer}>
      {gamePlayState === 'idle' && (
        <Pressable
          onPress={() => setActiveTab(activeTab === 'settings' ? 'screen1' : 'settings')}
          style={({ pressed }) => [
            styles.headerBtn,
            {
              borderColor: colors.primary,
              backgroundColor: activeTab === 'settings' ? colors.primary + '25' : pressed ? colors.primary + '25' : 'transparent',
            },
          ]}
        >
          <Settings size={16} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Sticky TUI Header */}
        <TuiHeader
          title="Kwiz"
          subtitle={getHeaderSubtitle()}
          Icon={KwizIcon}
          rightElement={headerRight}
        />

        <View style={styles.mainContent}>
          {renderActiveScreen()}
        </View>

        {/* Sticky bottom "Add Quiz" button for Home Screen */}
        {gamePlayState === 'idle' && activeTab === 'screen1' && (
          <View style={[styles.bottomButtonContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TuiButton
              onPress={() => setDrawerOpen(true)}
              variant="default"
              style={styles.addQuizButton}
            >
              Add Quiz
            </TuiButton>
          </View>
        )}

        {/* New Quiz Drawer */}
        <NewQuizDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onCreate={handleCreateQuiz}
        />

        {/* Context Menu Overlay (Popup with Card Preview) */}
        {selectedQuizForMenu && !renameModalVisible && (
          <ContextMenuOverlay
            quiz={selectedQuizForMenu.quiz}
            bounds={selectedQuizForMenu.bounds}
            onClose={() => setSelectedQuizForMenu(null)}
            onRename={() => {
              setNewQuizName(selectedQuizForMenu.quiz.title);
              setRenameModalVisible(true);
            }}
            onShare={async () => {
              await handleShareQuiz(selectedQuizForMenu.quiz);
              setSelectedQuizForMenu(null);
            }}
            onDelete={() => {
              handleDeleteQuizConfirm(selectedQuizForMenu.quiz);
            }}
          />
        )}

        {/* Rename Dialog Drawer */}
        <TuiDrawer
          visible={renameModalVisible}
          onClose={() => {
            setRenameModalVisible(false);
            setSelectedQuizForMenu(null);
          }}
          title="Rename Quiz"
        >
          <View style={{ paddingBottom: 10 }}>
            <TuiInput
              label="New Title"
              value={newQuizName}
              onChangeText={setNewQuizName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TuiButton
                onPress={() => {
                  setRenameModalVisible(false);
                  setSelectedQuizForMenu(null);
                }}
                variant="default"
                style={{ flex: 1 }}
                fullWidth={false}
              >
                Cancel
              </TuiButton>
              <TuiButton
                onPress={async () => {
                  if (selectedQuizForMenu && newQuizName.trim()) {
                    await handleRenameQuiz(selectedQuizForMenu.quiz.id, newQuizName.trim());
                    setRenameModalVisible(false);
                    setSelectedQuizForMenu(null);
                  }
                }}
                variant="accent"
                style={{ flex: 1 }}
                fullWidth={false}
              >
                Save
              </TuiButton>
            </View>
          </View>
        </TuiDrawer>
      </SafeAreaView>
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
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  settingRow: {
    marginVertical: 8,
  },
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    borderWidth: 1.5,
    width: 36,
    height: 36,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonContainer: {
    padding: 16,
    width: '100%',
  },
  addQuizButton: {
    paddingVertical: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  previewCardWrapper: {
    width: '100%',
  },
  contextMenuPopup: {
    borderWidth: 2,
    width: '100%',
    padding: 4,
  },
  contextMenuHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1.5,
    marginBottom: 4,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    width: '100%',
  },
  menuDivider: {
    height: 1.5,
    marginVertical: 2,
    width: '100%',
  },
});
