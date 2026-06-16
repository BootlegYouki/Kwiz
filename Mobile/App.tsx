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
import * as SecureStore from 'expo-secure-store';
import { parseMaytoon } from './src/utils/quiz-parser';
import { decode as decodeToon } from '@toon-format/toon';
import { extractText } from 'expo-pdf-text-extract';

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
  const [gameQueue, setGameQueue] = useState<QuizQuestion[]>([]);

  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedQuizForMenu, setSelectedQuizForMenu] = useState<{ quiz: QuizSet; bounds: { x: number; y: number; width: number; height: number } } | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newQuizName, setNewQuizName] = useState('');

  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    async function checkKey() {
      const key = await SecureStore.getItemAsync('kwiz_mistral_api_key');
      setHasApiKey(!!key);
    }
    checkKey();
  }, [drawerOpen, activeTab]);

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

  // Real Mistral LLM generation logic
  const handleCreateQuiz = async (config: {
    questionType: QuizSet['questionType'];
    count: number;
    customPrompt: string;
    attachments: { name: string; uri: string; content?: string }[];
  }) => {
    const primaryAttachment = config.attachments[0] || null;
    // Check if the attached file is a .kwiz file
    if (primaryAttachment && primaryAttachment.name.endsWith('.kwiz')) {
      try {
        const content = await FileSystem.readAsStringAsync(primaryAttachment.uri);
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

    // Load Mistral API key
    const apiKey = await SecureStore.getItemAsync('kwiz_mistral_api_key');
    if (!apiKey) {
      Alert.alert('API Key Required', 'Please set your Mistral API key in Settings first.');
      return;
    }

    const quizId = Math.random().toString(36).substring(7);
    const newQuizTitle = config.attachments.length > 0
      ? config.attachments[0].name.replace(/\.[^/.]+$/, "")
      : config.customPrompt
      ? `${config.customPrompt.substring(0, 20)}...`
      : 'General Quiz';

    const tempQuiz: QuizSet = {
      id: quizId,
      title: newQuizTitle,
      createdAt: new Date().toISOString(),
      questionType: config.questionType,
      questions: [],
      source: config.attachments.length > 0 ? 'attachment' : 'prompt',
      fileName: config.attachments.length > 0
        ? config.attachments.map(a => a.name).join(', ')
        : undefined,
      status: 'generating',
    };

    // Optimistically update list
    const updatedQuizzes = [tempQuiz, ...quizzes];
    setQuizzes(updatedQuizzes);
    await saveQuizzes(updatedQuizzes);

    // Run generation asynchronously
    (async () => {
      try {
        let sourceContent = '';

        if (config.attachments.length > 0) {
          // Concatenate pre-extracted text from all attachments
          config.attachments.forEach(att => {
            if (att.content) {
              sourceContent += `\n\n--- Source: ${att.name} ---\n\n${att.content}`;
            }
          });
        } else {
          sourceContent = config.customPrompt;
        }

        if (!sourceContent.trim()) {
          throw new Error('No prompt or PDF content found.');
        }

        const instructions = config.questionType === 'multiple_choice'
          ? `Generate exactly ${config.count} questions of type mc (multiple choice). Each must have 'k': 'mc', 'q': '<question text>', 'c' (an array of 4 choices), and 'a': '<correct option letter: A, B, C, or D>'.`
          : config.questionType === 'identification'
          ? `Generate exactly ${config.count} questions of type id (identification). Each must have 'k': 'id', 'q': '<question text>', 'a': '<text answer>', and 'n': <integer character count of the answer>. Crucial: The text answer ('a') must be short, containing at most 3 words.`
          : `Generate exactly ${config.count} questions alternating between mc (multiple choice) and id (identification) types. Crucial: All identification answers ('a') must be short, containing at most 3 words.`;

        const systemPrompt = `You are a quiz generator. Output ONLY valid TOON (Token-Oriented Object Notation) with no markdown fences, no formatting, no prefix, no suffix. \
You MUST generate ALL ${config.count} questions — do not stop early, do not truncate, do not summarize. Stopping before ${config.count} questions is a failure. \
Crucial: Every array item under \`qs[N]:\` must be indented with exactly 2 spaces, and its properties (k, q, c, a, n) must be indented with exactly 4 spaces. \
Crucial: The choices in \`c[4]\` must ALWAYS be wrapped in double quotes (e.g., c[4]: "choice A","choice B","choice C","choice D") to handle commas safely.

Format Example:
t: <quiz title>
qs[${config.count}]:
  - k: mc
    q: <question text>
    c[4]: "option A","option B","option C","option D"
    a: <correct option letter: A, B, C, or D>
  - k: id
    q: <question text>
    a: <text answer>
    n: <integer character count of answer>

${instructions} from the following content.
${config.customPrompt ? `Custom guidelines: ${config.customPrompt}` : ''}`;

        // 3. Request Chat Completion
        const completionResp = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Content:\n${sourceContent}` },
            ],
            temperature: 0.3,
            max_tokens: Math.max(config.count * 300, 4096),
          }),
        });

        if (!completionResp.ok) {
          const errBody = await completionResp.text();
          throw new Error(`Mistral completion failed: ${completionResp.status} ${errBody}`);
        }

        const completionData = await completionResp.json();
        const rawToon = completionData.choices[0].message.content || '';

        // Preprocess and repair TOON string
        let processedToon = rawToon.trim();
        processedToon = processedToon.replace(/^```[a-zA-Z0-9-]*\n/, '').replace(/\n```$/, '');

        const lines = processedToon.split('\n')
          .map((line: string) => line.trimEnd())
          .filter((line: string) => line.trim().length > 0);

        let inQsArray = false;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (/^qs\[\d+\]:/.test(line.trim())) {
            inQsArray = true;
            continue;
          }
          if (inQsArray) {
            if (line.startsWith('- k:')) {
              lines[i] = '  ' + line;
            } else if (/^(q|c|a|n)(:|\b|\[)/.test(line)) {
              lines[i] = '    ' + line;
            } else if (line.startsWith('  ') && /^(q|c|a|n)(:|\b|\[)/.test(line.slice(2))) {
              lines[i] = '  ' + line;
            }
          }
        }
        processedToon = lines.join('\n');

        const qsIndex = processedToon.search(/^qs\[\d+\]:/m);
        if (qsIndex !== -1) {
          const headerPart = processedToon.slice(0, qsIndex);
          const qsPart = processedToon.slice(qsIndex);

          const items = qsPart.split(/^\s*-\s*k\s*:/gm);
          let validItems: string[] = [];
          for (let j = 1; j < items.length; j++) {
            let itemStr = items[j];
            if (j === items.length - 1) {
              if (!/\s*a\s*:/.test(itemStr)) {
                continue;
              }
            }
            validItems.push('  - k:' + itemStr.trimEnd());
          }
          if (validItems.length > config.count) {
            validItems = validItems.slice(0, config.count);
          }
          processedToon = headerPart.trim() + '\n' + `qs[${validItems.length}]:\n` + validItems.join('\n');
        }

        const decoded = decodeToon(processedToon) as any;
        const parsed = parseMaytoon(decoded, {
          id: quizId,
          createdAt: tempQuiz.createdAt,
          questionType: config.questionType,
          source: tempQuiz.source,
          fileName: tempQuiz.fileName,
        });

        // Save and update state
        await saveQuiz(parsed);
        const reloaded = await getQuizzes();
        setQuizzes(reloaded);
      } catch (err: any) {
        console.error('Quiz generation error:', err);
        const errorQuiz: QuizSet = {
          ...tempQuiz,
          status: 'error',
          title: 'Generation Failed',
        };
        await saveQuiz(errorQuiz);
        const reloaded = await getQuizzes();
        setQuizzes(reloaded);
        Alert.alert('Generation Failed', err.message || 'An unknown error occurred during generation.');
      }
    })();
  };

  const handleSelectQuiz = (quiz: QuizSet) => {
    setActiveQuiz(quiz);
    setGamePlayState('playing');
  };

  const handleFinishQuiz = (score: number, answers: string[], finalQueue?: QuizQuestion[]) => {
    setGameScore(score);
    setGameAnswers(answers);
    setGameQueue(finalQueue || []);
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
          finalQueue={gameQueue.length > 0 ? gameQueue : undefined}
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
          hasApiKey={hasApiKey}
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
