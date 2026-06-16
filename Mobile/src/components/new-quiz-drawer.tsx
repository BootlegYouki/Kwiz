import React, { useState } from 'react';
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { TuiDrawer } from './tui-drawer';
import { TuiText } from './tui-text';
import { TuiButton } from './tui-button';
import { TuiInput } from './tui-input';
import { QuizTypeToggle } from './quiz-type-toggle';
import { ItemStepper } from './item-stepper';
import { QuizSet } from '../types';
import { useTheme } from '../theme/theme-provider';

interface NewQuizDrawerProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (config: {
    questionType: QuizSet['questionType'];
    count: number;
    customPrompt: string;
    attachment: { name: string; uri: string; size?: number } | null;
  }) => void;
}

export const NewQuizDrawer: React.FC<NewQuizDrawerProps> = ({ visible, onClose, onCreate }) => {
  const { colors } = useTheme();
  const [questionType, setQuestionType] = useState<QuizSet['questionType']>('multiple_choice');
  const [count, setCount] = useState(10);
  const [customPrompt, setCustomPrompt] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; uri: string; size?: number } | null>(null);

  const isKwizFile = !!(attachment && attachment.name.endsWith('.kwiz'));

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-powerpoint',
          'application/json',
          '*/*'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachment({
          name: file.name,
          uri: file.uri,
          size: file.size,
        });
      }
    } catch (err) {
      console.error('Failed to pick document:', err);
    }
  };

  const handleClearAttachment = () => {
    setAttachment(null);
  };

  const handleCreate = () => {
    onCreate({
      questionType,
      count,
      customPrompt,
      attachment,
    });
    // Reset state
    setQuestionType('multiple_choice');
    setCount(10);
    setCustomPrompt('');
    setAttachment(null);
    onClose();
  };

  return (
    <TuiDrawer visible={visible} onClose={onClose} title="New Quiz">
      <View style={styles.formContent}>
          
          {/* 1. Attachment */}
          <View style={styles.formSection}>
            {attachment ? (
              <View style={[styles.attachmentContainer, { borderColor: colors.primary }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <TuiText weight="bold" size="sm" numberOfLines={1}>
                    {attachment.name}
                  </TuiText>
                  {attachment.name.endsWith('.pptx') && (
                    <TuiText size="xs" style={{ color: colors.primary }} variant="accent">
                      * PPTX (will auto-convert to PDF)
                    </TuiText>
                  )}
                </View>
                <Pressable onPress={handleClearAttachment} style={styles.clearBtn}>
                  <TuiText weight="bold" style={{ color: colors.destructive }}>
                    Remove
                  </TuiText>
                </Pressable>
              </View>
            ) : (
              <TuiButton onPress={handlePickDocument} variant="outline">
                Attach PDF, PPTX or .kwiz
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
              <TuiButton onPress={handleCreate} variant="accent">
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
