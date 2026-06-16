import React, { useState } from 'react';
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { TuiDrawer } from './tui-drawer';
import { TuiText } from './tui-text';
import { TuiButton } from './tui-button';
import { TuiInput } from './tui-input';
import { QuizTypeToggle } from './quiz-type-toggle';
import { ItemStepper } from './item-stepper';
import { QuizSet } from '../types';
import { useTheme } from '../theme/theme-provider';
import { extractText } from 'expo-pdf-text-extract';

interface NewQuizDrawerProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (config: {
    questionType: QuizSet['questionType'];
    count: number;
    customPrompt: string;
    attachments: { name: string; uri: string; content?: string }[];
  }) => void;
}

export const NewQuizDrawer: React.FC<NewQuizDrawerProps> = ({ visible, onClose, onCreate }) => {
  const { colors } = useTheme();
  const [questionType, setQuestionType] = useState<QuizSet['questionType']>('multiple_choice');
  const [count, setCount] = useState(10);
  const [customPrompt, setCustomPrompt] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; uri: string; content?: string; isExtracting?: boolean }[]>([]);

  const isKwizFile = attachments.some(a => a.name.toLowerCase().endsWith('.kwiz'));
  const isExtracting = attachments.some(a => a.isExtracting);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const lowerName = file.name.toLowerCase();
        if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.kwiz')) {
          Alert.alert('Invalid File', 'Please select only PDF or .kwiz files.');
          return;
        }

        // If it's a .kwiz file, it must be the only attachment
        if (lowerName.endsWith('.kwiz')) {
          setAttachments([{ name: file.name, uri: file.uri }]);
          return;
        }

        // If we already have a .kwiz file, clear it when adding a PDF
        const hasKwiz = attachments.some(a => a.name.toLowerCase().endsWith('.kwiz'));

        const newAttachment = {
          name: file.name,
          uri: file.uri,
          isExtracting: true,
        };

        setAttachments(prev => [...(hasKwiz ? [] : prev), newAttachment]);

        // Run extraction in background immediately
        extractText(file.uri)
          .then(extractedText => {
            setAttachments(prev =>
              prev.map(a =>
                a.uri === file.uri
                  ? { ...a, content: extractedText, isExtracting: false }
                  : a
              )
            );
          })
          .catch(err => {
            console.error('PDF text extraction error:', err);
            Alert.alert('Extraction Failed', `Could not extract text from "${file.name}"`);
            setAttachments(prev => prev.filter(a => a.uri !== file.uri));
          });
      }
    } catch (err) {
      console.error('Failed to pick document:', err);
    }
  };

  const handleClearAttachment = (uri: string) => {
    setAttachments(prev => prev.filter(a => a.uri !== uri));
  };

  const handleCreate = () => {
    if (isExtracting) {
      Alert.alert('Please Wait', 'PDF text extraction is still in progress.');
      return;
    }
    onCreate({
      questionType,
      count,
      customPrompt,
      attachments,
    });
    // Reset state
    setQuestionType('multiple_choice');
    setCount(10);
    setCustomPrompt('');
    setAttachments([]);
    onClose();
  };

  return (
    <TuiDrawer visible={visible} onClose={onClose} title="New Quiz">
      <View style={styles.formContent}>
          
          {/* 1. Attachments list */}
          <View style={styles.formSection}>
            {attachments.map((att, idx) => (
              <View key={idx} style={[styles.attachmentContainer, { borderColor: colors.primary, marginBottom: 8 }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <TuiText weight="bold" size="sm" numberOfLines={1}>
                    {att.name}
                  </TuiText>
                  {att.isExtracting && (
                    <TuiText size="xs" style={{ color: colors.primary }} variant="accent">
                      * Extracting text in background...
                    </TuiText>
                  )}
                </View>
                <Pressable onPress={() => handleClearAttachment(att.uri)} style={styles.clearBtn}>
                  <TuiText weight="bold" style={{ color: colors.destructive }}>
                    Remove
                  </TuiText>
                </Pressable>
              </View>
            ))}

            {!isKwizFile && (
              <TuiButton onPress={handlePickDocument} variant="outline">
                Attach PDF or .kwiz
              </TuiButton>
            )}
          </View>

          {/* 2. Question Type beside Item Count */}
          <View style={styles.rowSection}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <QuizTypeToggle value={questionType} onChange={setQuestionType} disabled={isKwizFile} />
            </View>

            <View style={{ width: 150 }}>
              <ItemStepper value={count} onChange={setCount} disabled={isKwizFile} />
            </View>
          </View>

          {/* 3. Custom Prompt */}
          <View style={[styles.formSection, { marginTop: 12 }]}>
            <TuiInput
              label="Custom Prompt (Optional)"
              placeholder={isKwizFile ? "Not available for direct imports" : "e.g. term-based only, focus on chloroplasts"}
              value={customPrompt}
              onChangeText={setCustomPrompt}
              multiline={true}
              numberOfLines={4}
              containerStyle={{ marginVertical: 0, height: 100, opacity: isKwizFile ? 0.5 : 1 }}
              style={styles.textArea}
              editable={!isKwizFile}
            />
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <TuiButton onPress={onClose} variant="default">
                Cancel
              </TuiButton>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <TuiButton onPress={handleCreate} variant="accent" disabled={isExtracting}>
                Create
              </TuiButton>
            </View>
          </View>
        </View>
    </TuiDrawer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    width: '100%',
    zIndex: 5,
  },
  formContent: {
    paddingBottom: 8,
  },
  formSection: {
    marginBottom: 10,
    width: '100%',
  },
  rowSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    zIndex: 1000,
  },
  sectionLabel: {
    letterSpacing: 0.5,
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  attachmentContainer: {
    borderWidth: 1.5,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
