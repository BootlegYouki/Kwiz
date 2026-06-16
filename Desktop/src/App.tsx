import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  Sun,
  Moon,
  BookOpen,
  Layers,
  CheckSquare,
  Shuffle,
  Trophy,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Home,
} from 'lucide-react';
import { TuiContainer } from './components/TuiContainer';
import { TuiButton } from './components/TuiButton';
import { TuiAlertModal } from './components/TuiAlertModal';
import { TitleBar } from './components/TitleBar';
import { IconSvg } from './components/IconSvg';
import { QuizTypeToggle } from './components/QuizTypeToggle';
import { LetterBoxInput } from './components/LetterBoxInput';
import { ItemStepper } from './components/ItemStepper';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { getQuizzes, saveQuizzes } from './utils/quiz-storage';
import { QuizSet, QuizQuestion } from './types';
import { open, save } from '@tauri-apps/plugin-dialog';
import {
  generateQuiz,
  checkMarkitdown,
  convertToMarkdown,
  readKwizFile,
  writeKwizFile,
} from './utils/llm';
import { openUrl } from '@tauri-apps/plugin-opener';
import { parseMaytoon } from './utils/quiz-parser';
import { decode as decodeToon } from '@toon-format/toon';


// ─── Accent palette (same as BootHub to preserve theme system) ───────────────
const ACCENT_COLORS = {
  classic: { dark: '#FFFFFF', light: '#000000' },
  gray: { dark: '#71717A', light: '#71717A' },
  amber: { dark: '#F59E0B', light: '#D97706' },
  green: { dark: '#10B981', light: '#059669' },
  rose: { dark: '#F43F5E', light: '#E11D48' },
  cobalt: { dark: '#3B82F6', light: '#2563EB' },
};
type AccentTheme = keyof typeof ACCENT_COLORS;
type QuizTypeFilter = 'all' | 'multiple_choice' | 'identification' | 'hybrid';
type AppView = 'home' | 'playing' | 'results';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function checkAnswer(question: QuizQuestion, answer: string): boolean {
  if (!answer) return false;
  const normalizedAnswer = answer.toLowerCase().replace(/\s/g, '');
  const correctAnswer = question.answer.toLowerCase().replace(/\s/g, '');

  if (normalizedAnswer === correctAnswer) return true;

  if (question.type === 'multiple_choice' && question.choices) {
    const letterMap = ['a', 'b', 'c', 'd'];
    const ansIdx = letterMap.indexOf(correctAnswer);
    if (ansIdx !== -1 && question.choices[ansIdx]) {
      const correctChoiceText = question.choices[ansIdx].toLowerCase().replace(/\s/g, '');
      if (normalizedAnswer === correctChoiceText) {
        return true;
      }
    }
  }
  return false;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface QuizCardProps {
  quiz: QuizSet;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, isSelected, onClick, onContextMenu }) => {
  const typeLabel =
    quiz.questionType === 'multiple_choice'
      ? 'MC'
      : quiz.questionType === 'identification'
        ? 'ID'
        : 'HY';

  const typeColor =
    quiz.questionType === 'multiple_choice'
      ? 'text-cobalt'
      : quiz.questionType === 'identification'
        ? 'text-amber'
        : 'text-green';

  const isGenerating = quiz.status === 'generating';
  const isError = quiz.status === 'error';

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      disabled={isGenerating}
      className={`w-full border-[1.5px] px-4 py-3 text-left flex flex-col gap-1 cursor-pointer select-none transition-all ${isSelected
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border text-foreground hover:border-primary hover:bg-primary/5'
        } ${isGenerating ? 'opacity-60 cursor-not-allowed animate-pulse' : ''} ${isError ? 'border-destructive bg-destructive/10 text-destructive/90 cursor-default' : ''
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold leading-snug flex-1 min-w-0 break-words">
          {isGenerating ? `Generating: ${quiz.title}` : isError ? `Failed: ${quiz.title}` : quiz.title}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-muted font-mono">
          {isGenerating ? 'Please wait...' : isError ? 'Right-click for options' : `${quiz.questions.length} questions`}
        </span>
      </div>
    </button>
  );
};

// ─── Rename Quiz Modal ────────────────────────────────────────────────────────
interface RenameQuizModalProps {
  visible: boolean;
  onClose: () => void;
  quizTitle: string;
  onRename: (newTitle: string) => void;
}

const RenameQuizModal: React.FC<RenameQuizModalProps> = ({ visible, onClose, quizTitle, onRename }) => {
  const [title, setTitle] = useState(quizTitle);

  useEffect(() => {
    if (visible) {
      setTitle(quizTitle);
    }
  }, [visible, quizTitle]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 select-none animate-in fade-in duration-100">
      <div className="w-full max-w-sm">
        <TuiContainer
          label="Rename Quiz"
          disableHover={true}
          contentStyle={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-muted">Quiz Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full border-[1.5px] border-border bg-card px-3 py-2 text-xs focus:outline-none font-mono text-foreground focus:border-primary"
            />
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <TuiButton onPress={onClose} variant="outline">
                Cancel
              </TuiButton>
            </div>
            <div className="flex-1">
              <TuiButton
                onPress={() => {
                  if (title.trim()) {
                    onRename(title.trim());
                  }
                }}
                variant="accent"
              >
                Save
              </TuiButton>
            </div>
          </div>
        </TuiContainer>
      </div>
    </div>
  );
};

// ─── New Quiz Modal ───────────────────────────────────────────────────────────

interface Attachment {
  name: string;
  path: string;
  content?: string;
  status: 'idle' | 'converting' | 'ready' | 'error';
  error?: string;
}

interface NewQuizModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (config: {
    questionType: QuizSet['questionType'];
    count: number;
    customPrompt: string;
    attachments: Attachment[];
  }) => void;
}

const NewQuizModal: React.FC<NewQuizModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const [questionType, setQuestionType] = useState<QuizSet['questionType']>('multiple_choice');
  const [count, setCount] = useState(10);
  const [customPrompt, setCustomPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (!visible) {
      setQuestionType('multiple_choice');
      setCount(10);
      setCustomPrompt('');
      setAttachments([]);
    }
  }, [visible]);

  const handlePickFile = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Quiz Documents',
          extensions: ['pdf', 'pptx', 'kwiz']
        }]
      });
      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];

        // If a .kwiz file is picked, it should be the only attachment
        const hasKwiz = paths.some(p => p.toLowerCase().endsWith('.kwiz'));
        if (hasKwiz) {
          const kwizPath = paths.find(p => p.toLowerCase().endsWith('.kwiz'))!;
          const name = kwizPath.split(/[\\/]/).pop() || kwizPath;
          setAttachments([{ name, path: kwizPath, status: 'ready' }]);
        } else {
          // Add new documents and filter out any existing .kwiz
          const newAttachments: Attachment[] = paths.map(p => {
            const name = p.split(/[\\/]/).pop() || p;
            return { name, path: p, status: 'converting' };
          });

          setAttachments(prev => {
            const filtered = prev.filter(att => !att.name.toLowerCase().endsWith('.kwiz'));
            return [...filtered, ...newAttachments];
          });

          // Trigger conversion immediately for each added file
          newAttachments.forEach(async (att) => {
            try {
              const md = await convertToMarkdown(att.path);
              setAttachments(prev => prev.map(item =>
                item.path === att.path ? { ...item, status: 'ready', content: md } : item
              ));
            } catch (err: any) {
              setAttachments(prev => prev.map(item =>
                item.path === att.path ? { ...item, status: 'error', error: err?.message || err || 'Failed to convert' } : item
              ));
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to open file dialog:', err);
    }
  };

  if (!visible) return null;

  const isKwizFile = attachments.some(att => att.name.toLowerCase().endsWith('.kwiz'));
  const isConverting = attachments.some(att => att.status === 'converting');
  const hasErrors = attachments.some(att => att.status === 'error');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 select-none animate-in fade-in duration-100">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col">
        <TuiContainer
          label="New Quiz — Details"
          disableHover={true}
          style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
          contentStyle={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', padding: '20px' }}
        >
          {/* 1. Attachments */}
          <div className="flex flex-col gap-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center justify-between border-[1.5px] border-primary bg-primary/5 p-2.5 font-mono">
                <div className="flex-1 truncate mr-2 flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-foreground truncate block">{att.name}</span>
                  {att.status === 'converting' && (
                    <span className="text-[10px] text-yellow-500 font-bold animate-pulse">Converting to markdown...</span>
                  )}
                  {att.status === 'ready' && (
                    <span className="text-[10px] text-green-500 font-bold">Ready</span>
                  )}
                  {att.status === 'error' && (
                    <span className="text-[10px] text-destructive font-bold truncate">Error: {att.error}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="p-1 hover:bg-destructive/10 text-destructive cursor-pointer transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {!isKwizFile && (
              <button
                type="button"
                onClick={handlePickFile}
                className="w-full border-[1.5px] border-dashed border-primary text-primary py-2.5 hover:bg-primary/10 cursor-pointer text-xs font-bold transition-all text-center"
              >
                {attachments.length > 0 ? "+ Add More Files (PDF, PPTX)" : "Attach PDF, PPTX or .kwiz"}
              </button>
            )}
          </div>

          {/* 2. Question Type beside Item Count */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <QuizTypeToggle value={questionType} onChange={setQuestionType} disabled={isKwizFile} />
            </div>
            <div className="w-40 flex flex-col gap-1.5">
              <ItemStepper
                value={count}
                onChange={setCount}
                min={5}
                max={100}
                step={5}
                disabled={isKwizFile}
              />
            </div>
          </div>

          {/* 3. Custom Prompt */}
          <div className="flex flex-col gap-1.5">
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isKwizFile}
              placeholder={isKwizFile ? "Not available for direct imports" : "e.g. term-based only, focus on chloroplasts"}
              className="w-full border-[1.5px] border-border bg-card px-3 py-2 text-xs focus:outline-none font-mono text-foreground resize-none focus:border-primary disabled:opacity-50"
            />
          </div>




          {/* Action Row */}
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <TuiButton onPress={onClose} variant="outline">
                Cancel
              </TuiButton>
            </div>
            <div className="flex-1">
              <TuiButton
                disabled={isConverting || hasErrors || (attachments.length === 0 && !customPrompt.trim())}
                onPress={() => {
                  onCreate({
                    questionType,
                    count,
                    customPrompt,
                    attachments,
                  });
                }}
                variant="accent"
              >
                Create
              </TuiButton>
            </div>
          </div>
        </TuiContainer>
      </div>
    </div>
  );
};
// ─── AI Setup Modal ────────────────────────────────────────────────────────────
interface AiSetupModalProps {
  visible: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (k: string) => void;
}

const AiSetupModal: React.FC<AiSetupModalProps> = ({ visible, onClose, apiKey, setApiKey }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 select-none animate-in fade-in duration-100">
      <div className="w-full max-w-md">
        <TuiContainer
          label="AI Engine Setup"
          disableHover={true}
          contentStyle={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}
        >
          <div className="flex flex-col gap-4 font-mono text-xs">
            <p className="text-[11px] text-muted leading-relaxed">
              Connect to Mistral AI cloud models for lightning-fast, high-quality quiz generations.
            </p>
            <div className="flex flex-col gap-2 border-[1.5px] border-border p-3 bg-card/30">
              <span className="font-bold text-[10px] uppercase text-muted">Mistral API Key</span>
              <input
                type="password"
                placeholder="Enter your Mistral API key..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  localStorage.setItem('kwiz_api_key', e.target.value);
                }}
                className="w-full border-[1.5px] border-border bg-card px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground font-mono"
              />
              <button
                type="button"
                onClick={() => openUrl('https://console.mistral.ai/api-keys/')}
                className="text-[10px] text-primary hover:underline cursor-pointer text-left font-mono mt-1"
              >
                → Get your API key at console.mistral.ai
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <div className="flex-grow">
              <TuiButton onPress={onClose} variant="outline">
                Close
              </TuiButton>
            </div>
          </div>
        </TuiContainer>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Show window after assets load
  useEffect(() => {
    const t = setTimeout(() => {
      getCurrentWindow().show().catch(console.error);
    }, 150);
    return () => clearTimeout(t);
  }, []);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('kwiz_theme_mode') as 'dark' | 'light') ?? 'dark';
  });
  const [accentTheme] = useState<AccentTheme>('classic');

  const handleToggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    localStorage.setItem('kwiz_theme_mode', next);
  };

  // ── Quiz data ──────────────────────────────────────────────────────────────
  const [quizzes, setQuizzes] = useState<QuizSet[]>(() => getQuizzes());

  const saveAndSet = (next: QuizSet[]) => {
    setQuizzes(next);
    saveQuizzes(next);
  };

  // ── UI state ───────────────────────────────────────────────────────────────
  const [view, setView] = useState<AppView>('home');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<QuizTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewQuizModal, setShowNewQuizModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    quiz: QuizSet;
  } | null>(null);
  const [renameQuizModal, setRenameQuizModal] = useState<{
    visible: boolean;
    quiz: QuizSet;
  } | null>(null);
  const [showAiSetupModal, setShowAiSetupModal] = useState(false);
  const [markitdownAvailable, setMarkitdownAvailable] = useState<boolean | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('kwiz_api_key') ?? '';
  });

  useEffect(() => {
    const check = () => checkMarkitdown().then(setMarkitdownAvailable);
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // ── Quiz Player state ──────────────────────────────────────────────────────
  const [retryMode, setRetryMode] = useState(false);
  const [questionQueue, setQuestionQueue] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [lockedStates, setLockedStates] = useState<boolean[]>([]);

  // ── Results state ─────────────────────────────────────────────────────────
  const [finalScore, setFinalScore] = useState(0);
  const [finalAnswers, setFinalAnswers] = useState<string[]>([]);
  const [finalQueue, setFinalQueue] = useState<QuizQuestion[]>([]);

  // ── Alert modal ────────────────────────────────────────────────────────────
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({ visible: false, title: '', message: '', type: 'alert', onConfirm: () => { } });

  const showConfirm = (
    title: string,
    message: string,
    opts?: { confirmText?: string; cancelText?: string; isDestructive?: boolean }
  ) =>
    new Promise<boolean>((resolve) => {
      setDialog({
        visible: true,
        title,
        message,
        type: 'confirm',
        confirmText: opts?.confirmText ?? 'OK',
        cancelText: opts?.cancelText ?? 'Cancel',
        isDestructive: opts?.isDestructive ?? false,
        onConfirm: () => { setDialog((p) => ({ ...p, visible: false })); resolve(true); },
        onCancel: () => { setDialog((p) => ({ ...p, visible: false })); resolve(false); },
      });
    });

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId) ?? null;

  const filteredQuizzes = quizzes.filter((q) => {
    if (typeFilter !== 'all' && q.questionType !== typeFilter) return false;
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      return q.title.toLowerCase().includes(s) || (q.subject ?? '').toLowerCase().includes(s);
    }
    return true;
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  const startQuiz = (quiz: QuizSet) => {
    const q = [...quiz.questions];
    setQuestionQueue(q);
    setCurrentIndex(0);
    setUserAnswers(new Array(q.length).fill(''));
    setLockedStates(new Array(q.length).fill(false));
    setView('playing');
  };

  const handleSelectQuiz = (quiz: QuizSet) => {
    setSelectedQuizId(quiz.id);
    startQuiz(quiz);
  };

  const handleLockIn = (overrideValue?: string) => {
    if (!selectedQuiz) return;
    const ans = overrideValue !== undefined ? overrideValue : userAnswers[currentIndex];
    const nextLocked = [...lockedStates];
    nextLocked[currentIndex] = true;

    const q = questionQueue[currentIndex];
    const isCorrect = checkAnswer(q, ans);
    if (retryMode && !isCorrect) {
      const nextQueue = [...questionQueue, q];
      const nextAnswers = [...userAnswers];
      nextAnswers[currentIndex] = ans;
      const nextLockedQueue = [...nextLocked];
      
      nextAnswers.push('');
      nextLockedQueue.push(false);

      setQuestionQueue(nextQueue);
      setUserAnswers(nextAnswers);
      setLockedStates(nextLockedQueue);
    } else {
      const nextAnswers = [...userAnswers];
      nextAnswers[currentIndex] = ans;
      setUserAnswers(nextAnswers);
      setLockedStates(nextLocked);
    }
  };

  const handleNext = () => {
    if (!selectedQuiz) return;
    if (!lockedStates[currentIndex]) {
      handleLockIn();
      return;
    }

    if (currentIndex + 1 < questionQueue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      let score = 0;
      selectedQuiz.questions.forEach((qq, i) => { if (checkAnswer(qq, userAnswers[i])) score++; });
      setFinalScore(score);
      setFinalAnswers([...userAnswers]);
      setFinalQueue([...questionQueue]);
      setView('results');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleExitQuiz = () => {
    setView('home');
    setCurrentIndex(0);
    setSelectedQuizId(null);
  };

  // ── Mouse side buttons (back/forward) for prev/next navigation ────────────
  useEffect(() => {
    if (view !== 'playing') return;
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 3) { e.preventDefault(); handlePrev(); }
      if (e.button === 4) { e.preventDefault(); handleNext(); }
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [view, currentIndex, lockedStates, userAnswers, selectedQuiz]);

  const handleRetake = () => {
    if (!selectedQuiz) return;
    setRetryMode(false);
    startQuiz(selectedQuiz);
  };

  const handleDeleteQuiz = async (quiz: QuizSet) => {
    const ok = await showConfirm('Delete Quiz', `Delete "${quiz.title}"?`, {
      confirmText: 'Delete',
      isDestructive: true,
    });
    if (ok) {
      const next = quizzes.filter((q) => q.id !== quiz.id);
      saveAndSet(next);
      if (selectedQuizId === quiz.id) setSelectedQuizId(null);
    }
  };

  const handleRenameQuiz = (quiz: QuizSet) => {
    setRenameQuizModal({ visible: true, quiz });
  };

  const executeRenameQuiz = (newTitle: string) => {
    if (renameQuizModal && newTitle.trim()) {
      const { quiz } = renameQuizModal;
      const next = quizzes.map((q) =>
        q.id === quiz.id ? { ...q, title: newTitle.trim() } : q
      );
      saveAndSet(next);
      if (selectedQuizId === quiz.id) {
        setSelectedQuizId(null);
        setTimeout(() => setSelectedQuizId(quiz.id), 0);
      }
      setRenameQuizModal(null);
    }
  };

  const handleExportQuiz = async (quiz: QuizSet) => {
    try {
      const path = await save({
        filters: [{
          name: 'Kwiz File',
          extensions: ['kwiz'],
        }],
        defaultPath: `${quiz.title}.kwiz`,
      });
      if (path) {
        await writeKwizFile(path, JSON.stringify(quiz, null, 2));
      }
    } catch (err) {
      console.error('Failed to export quiz:', err);
    }
  };

  const handleCreateQuiz = (config: {
    questionType: QuizSet['questionType'];
    count: number;
    customPrompt: string;
    attachments: Attachment[];
  }) => {
    const primaryAttachment = config.attachments[0] || null;
    const isKwiz = primaryAttachment?.name.toLowerCase().endsWith('.kwiz');

    if (isKwiz && primaryAttachment) {
      readKwizFile(primaryAttachment.path)
        .then((content) => {
          try {
            const importedQuiz = JSON.parse(content);
            if (importedQuiz && importedQuiz.title && Array.isArray(importedQuiz.questions)) {
              importedQuiz.id = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              importedQuiz.createdAt = new Date().toISOString();
              importedQuiz.status = 'ready';
              const next = [importedQuiz, ...quizzes];
              saveAndSet(next);
              setSelectedQuizId(importedQuiz.id);
              setShowNewQuizModal(false);
            } else {
              alert('Invalid quiz format inside .kwiz file');
            }
          } catch (err) {
            console.error('Failed to parse .kwiz file:', err);
            alert('Failed to parse .kwiz file: ' + err);
          }
        })
        .catch((err) => {
          console.error('Failed to read .kwiz file:', err);
          alert('Failed to read .kwiz file: ' + err);
        });
      return;
    }

    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newQuizTitle = config.attachments.length > 0
      ? config.attachments.length === 1
        ? config.attachments[0].name.replace(/\.[^/.]+$/, "")
        : `${config.attachments[0].name.replace(/\.[^/.]+$/, "")} (+${config.attachments.length - 1} files)`
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

    const updatedQuizzes = [tempQuiz, ...quizzes];
    saveAndSet(updatedQuizzes);
    setSelectedQuizId(quizId);
    setShowNewQuizModal(false);
    setView('home');

    // Concatenate the pre-converted markdown contents from all attachments
    let concatenatedMarkdown = '';
    config.attachments.forEach(att => {
      if (att.content) {
        concatenatedMarkdown += `\n\n--- Source: ${att.name} ---\n\n${att.content}`;
      }
    });

    generateQuiz({
      markdownContent: concatenatedMarkdown,
      prompt: config.customPrompt || undefined,
      questionType: config.questionType,
      count: config.count,
      apiKey,
    })
      .then((rawToon) => {
        try {
          // Preprocess and repair TOON string to handle indentation drops and trailing spaces
          let processedToon = rawToon.trim();
          processedToon = processedToon.replace(/^```[a-zA-Z0-9-]*\n/, '').replace(/\n```$/, '');

          const lines = processedToon.split('\n')
            .map(line => line.trimEnd())
            .filter(line => line.trim().length > 0);

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

          // Handle LLM truncation: drop the incomplete last question and rewrite array count
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
            // Enforce the requested count ceiling
            if (validItems.length > config.count) {
              validItems = validItems.slice(0, config.count);
            }
            processedToon = headerPart.trim() + '\n' + `qs[${validItems.length}]:\n` + validItems.join('\n');
          }

          // Decode TOON formatted response
          const decoded = decodeToon(processedToon) as any;
          const parsed = parseMaytoon(decoded, {
            id: quizId,
            createdAt: tempQuiz.createdAt,
            questionType: config.questionType,
            source: tempQuiz.source,
            fileName: tempQuiz.fileName,
          });

          setQuizzes((prev) => {
            const next = prev.map((q) =>
              q.id === quizId
                ? {
                  ...q,
                  title: parsed.title || q.title,
                  status: 'ready' as const,
                  questions: parsed.questions,
                }
                : q
            );
            saveQuizzes(next);
            return next;
          });
        } catch (parseErr) {
          console.error('Failed to decode/parse TOON format:', rawToon, parseErr);
          setQuizzes((prev) => {
            const next = prev.map((q) =>
              q.id === quizId ? { ...q, status: 'error' as const } : q
            );
            saveQuizzes(next);
            return next;
          });
        }
      })
      .catch((err) => {
        console.error('Quiz generation failed:', err);
        setQuizzes((prev) => {
          const next = prev.map((q) =>
            q.id === quizId ? { ...q, status: 'error' as const } : q
          );
          saveQuizzes(next);
          return next;
        });
      });
  };

  // ── Theme CSS vars ─────────────────────────────────────────────────────────
  const isDark = themeMode === 'dark';
  const primaryColor = ACCENT_COLORS[accentTheme][isDark ? 'dark' : 'light'];
  const primaryForeground = isDark ? '#000000' : '#FFFFFF';

  const rootStyles = {
    '--color-background': isDark ? '#18181B' : '#F4F4F5',
    '--color-foreground': isDark ? '#FAFAFA' : '#09090B',
    '--color-card': isDark ? '#18181B' : '#F4F4F5',
    '--color-border': isDark ? '#52525B' : '#D4D4D8',
    '--color-muted': isDark ? '#A1A1AA' : '#71717A',
    '--color-primary': primaryColor,
    '--color-primary-foreground': primaryForeground,
    '--color-destructive': '#ef4444',
  } as React.CSSProperties;

  // ── Sidebar content ────────────────────────────────────────────────────────
  const filterTabs: { label: string; value: QuizTypeFilter; icon: React.ReactNode }[] = [
    { label: 'All', value: 'all', icon: <BookOpen size={15} /> },
    { label: 'Multiple Choice', value: 'multiple_choice', icon: <CheckSquare size={15} /> },
    { label: 'Identification', value: 'identification', icon: <Layers size={15} /> },
    { label: 'Hybrid', value: 'hybrid', icon: <Shuffle size={15} /> },
  ];

  // ── Player helpers ─────────────────────────────────────────────────────────
  const currentQuestion = questionQueue[currentIndex] ?? null;
  const selectedAnswer = userAnswers[currentIndex] ?? '';
  const isLocked = lockedStates[currentIndex] ?? false;
  const totalQ = view === 'results' ? finalQueue.length : questionQueue.length;

  // ── Results helpers ────────────────────────────────────────────────────────
  const resultTotal = finalQueue.length || 1;
  const percentage = Math.round((finalScore / resultTotal) * 100);
  const reviewComment =
    percentage === 100 ? 'Perfect score!' :
      percentage >= 80 ? 'Great work!' :
        percentage >= 50 ? 'Passed!' :
          'Failed. Study more!';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={rootStyles}
      className="h-screen bg-background text-foreground flex flex-col font-mono antialiased overflow-hidden"
    >
      <TitleBar title="Kwiz" skipCloseConfirm={true} />

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden min-h-0">
        {/* ── TOP NAV ─────────────────────────────────────────────────── */}
        <nav className="shrink-0 select-none">
          <TuiContainer label="Nav" style={{ width: '100%' }}>
            <div className="flex items-center gap-6 py-1 select-none">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <IconSvg className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h1 className="text-sm md:text-base font-bold tracking-widest text-primary leading-none">Kwiz</h1>
                  <p className="text-[10px] text-muted leading-none mt-1">by BootlegYouki</p>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={handleToggleTheme}
                className="w-9 h-9 p-0 flex items-center justify-center border-[1.5px] border-border hover:bg-primary/10 active:scale-95 cursor-pointer select-none shrink-0"
                title="Toggle Theme"
              >
                {isDark ? <Sun size={18} className="text-primary" /> : <Moon size={18} className="text-primary" />}
              </button>
            </div>
          </TuiContainer>
        </nav>

        {/* ── LOWER CONTAINER ─────────────────────────────────────────── */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* ── SIDEBAR ─────────────────────────────────────────────── */}
          <aside className="w-64 shrink-0 flex flex-col gap-4 min-h-0 select-none">
            {/* Filter tabs */}
            <TuiContainer
              label="Library"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
              contentStyle={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0, overflowY: 'auto' }}
            >
              {/* New Quiz button */}
              <button
                onClick={() => setShowNewQuizModal(true)}
                className="w-full border-[1.5px] border-primary text-primary py-3 px-4 flex items-center justify-center gap-2 hover:bg-primary/20 cursor-pointer text-sm font-bold active:scale-95 shrink-0 transition-all"
              >
                <span>New Quiz</span>
              </button>

              {/* Home button */}
              <button
                onClick={() => {
                  setView('home');
                  setSelectedQuizId(null);
                }}
                className={`w-full border-[1.5px] py-3 px-4 flex items-center justify-center gap-2 cursor-pointer text-sm font-bold active:scale-95 shrink-0 transition-all ${view === 'home'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:border-primary hover:bg-primary/5'
                  }`}
              >
                <span>Home</span>
              </button>

              {/* Separator */}
              <div className="border-b-[1.5px] border-border my-1 shrink-0" />

              {/* Quiz list */}
              <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
                {filteredQuizzes.length === 0 ? (
                  <p className="text-[10px] text-muted text-center py-4 font-mono">
                    {quizzes.length === 0 ? 'No quizzes yet.\nClick New Quiz!' : 'No matches.'}
                  </p>
                ) : (
                  filteredQuizzes.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      isSelected={selectedQuizId === quiz.id}
                      onClick={() => handleSelectQuiz(quiz)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          quiz,
                        });
                      }}
                    />
                  ))
                )}
              </div>
            </TuiContainer>

            {/* ── STATUS ──────────────────────────────────────────────── */}
            <TuiContainer
              label="Status"
              disableHover={true}
              style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}
              contentStyle={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}
            >
              <div className="flex flex-col gap-2 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">AI:</span>
                  <span className="text-primary font-bold">MISTRAL AI</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Key:</span>
                  <span className={apiKey ? 'text-green-500 font-bold' : 'text-destructive font-bold'}>
                    {apiKey ? 'CONFIGURED' : 'MISSING'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">markitdown:</span>
                  <span className={markitdownAvailable ? 'text-green-500 font-bold' : 'text-destructive font-bold'}>
                    {markitdownAvailable === null ? '...' : markitdownAvailable ? 'FOUND' : 'NOT FOUND'}
                  </span>
                </div>
                <button
                  onClick={() => setShowAiSetupModal(true)}
                  className="w-full border-[1.5px] border-border text-foreground py-2 px-3 text-xs font-bold hover:border-primary hover:bg-primary/5 cursor-pointer transition-all active:scale-98"
                >
                  AI Setup
                </button>
              </div>
            </TuiContainer>
          </aside>

          {/* ── MAIN CONTENT ────────────────────────────────────────── */}
          <main className="flex-1 min-h-0 min-w-0 flex flex-col">
            <TuiContainer
              label={
                view === 'playing' && selectedQuiz
                  ? `${selectedQuiz.title}`
                  : view === 'results' && selectedQuiz
                    ? `Results — ${selectedQuiz.title}`
                    : 'Main'
              }
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}
              contentStyle={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, padding: '16px', overflowY: 'auto' }}
            >
              {/* ── HOME VIEW ─────────────────────────────────────── */}
              {view === 'home' && (
                <div className="h-full flex flex-col gap-4 overflow-y-auto min-h-0">
                  {quizzes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-muted select-none">
                      <BookOpen size={48} className="opacity-20" />
                      <p className="text-sm font-bold text-center">No quizzes yet.<br />Create your first one!</p>
                    </div>
                  ) : (
                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      {quizzes.map((quiz) => {
                        const typeLabel = quiz.questionType === 'multiple_choice' ? 'MC' : quiz.questionType === 'identification' ? 'ID' : 'HY';
                        const typeColor = quiz.questionType === 'multiple_choice' ? 'var(--color-cobalt, #3B82F6)' : quiz.questionType === 'identification' ? '#F59E0B' : '#10B981';
                        const isGenerating = quiz.status === 'generating';
                        const isError = quiz.status === 'error';
                        return (
                          <button
                            key={quiz.id}
                            onClick={() => !isGenerating && !isError && handleSelectQuiz(quiz)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                quiz,
                              });
                            }}
                            disabled={isGenerating}
                            className={`border-[1.5px] p-4 flex flex-col justify-between text-left cursor-pointer select-none transition-all ${isGenerating ? 'border-border opacity-60 cursor-not-allowed animate-pulse' :
                              isError ? 'border-destructive bg-destructive/10 text-destructive/90 hover:bg-destructive/20' :
                                'border-border hover:border-primary hover:bg-primary/5'
                              }`}
                          >
                            <div className="flex items-start justify-between w-full gap-2">
                              <span className="text-[10px] text-muted font-mono">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex-1 flex items-center py-2">
                              <span className="text-sm font-bold text-foreground leading-snug line-clamp-4 break-words">
                                {isGenerating ? `Generating: ${quiz.title}` : isError ? `Failed: ${quiz.title}` : quiz.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted font-mono shrink-0">
                              {isGenerating ? 'Please wait...' : isError ? 'Generation failed. Select in sidebar to delete.' : `${quiz.questions.length} questions`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── PLAYING VIEW ──────────────────────────────────── */}
              {view === 'playing' && selectedQuiz && currentQuestion && (
                <div className="flex gap-4 h-full min-h-0">

                  {/* LEFT — Question list / progress panel */}
                  <div className="w-56 shrink-0 flex flex-col min-h-0">
                    <TuiContainer
                      label="Progress"
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                      contentStyle={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0, overflowY: 'auto' }}
                    >
                      {/* Question number buttons */}
                      {questionQueue.map((q, idx) => {
                        const answered = lockedStates[idx];
                        const correct = answered && checkAnswer(q, userAnswers[idx]);
                        const wrong = answered && !correct;
                        const active = idx === currentIndex;
                        const isRetry = selectedQuiz && idx >= selectedQuiz.questions.length;

                        let cls = 'border-border text-muted hover:border-foreground hover:text-foreground';
                        if (active && !answered) cls = 'border-primary text-primary bg-primary/10';
                        if (correct) cls = 'border-green-500 text-green-500 bg-green-500/10';
                        if (wrong) cls = 'border-destructive text-destructive bg-destructive/10';
                        if (active && answered && correct) cls = 'border-green-500 text-green-500 bg-green-500/20';
                        if (active && answered && wrong) cls = 'border-destructive text-destructive bg-destructive/20';

                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-full border-[1.5px] px-4 py-3 text-left text-sm font-bold font-mono cursor-pointer select-none transition-all shrink-0 truncate ${cls}`}
                            title={`${isRetry ? '[RETRY] ' : ''}Q${idx + 1}: ${q.question}`}
                          >
                            {q.question}
                          </button>
                        );
                      })}

                      {/* Retry toggle + Exit at bottom */}
                      <div className="mt-auto pt-3 shrink-0 flex flex-col gap-2">
                        <button
                          onClick={() => setRetryMode(r => !r)}
                          className={`w-full border-[1.5px] px-3 py-2 text-sm font-bold font-mono transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${retryMode ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-border text-muted hover:border-foreground hover:text-foreground'
                            }`}
                        >
                          <span>Retry Wrong</span>
                          <span className={`text-xs font-mono ${retryMode ? 'text-amber-500' : 'text-muted'}`}>{retryMode ? 'ON' : 'OFF'}</span>
                        </button>
                        <TuiButton
                          onPress={handleExitQuiz}
                          variant="destructive"
                          className="w-full py-2.5 text-sm"
                        >
                          Exit Quiz
                        </TuiButton>
                      </div>
                    </TuiContainer>
                  </div>

                  {/* RIGHT — Question + answer area */}
                  <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
                    {/* Question */}
                    <TuiContainer label={`Question ${currentIndex + 1}`}>
                      <p className="text-lg md:text-xl font-bold leading-relaxed text-foreground py-2">
                        {currentQuestion.question}
                      </p>
                    </TuiContainer>

                    {/* Answer area */}
                    <div className="flex-1 min-h-0">
                      {currentQuestion.type === 'multiple_choice' ? (
                        <div className="flex flex-col gap-3">
                          {currentQuestion.choices.map((choice, ci) => {
                            const isSelected = selectedAnswer === choice;
                            const isCorrectChoice = checkAnswer(currentQuestion, choice);
                            let borderCls = 'border-border hover:border-primary';
                            let bgCls = 'bg-transparent';
                            if (isSelected && !isLocked) { borderCls = 'border-primary'; bgCls = 'bg-primary/10'; }
                            if (isLocked) {
                              if (isCorrectChoice) { borderCls = 'border-green-500'; bgCls = 'bg-green-500/10'; }
                              else if (isSelected) { borderCls = 'border-destructive'; bgCls = 'bg-destructive/10'; }
                            }
                            return (
                              <button
                                key={ci}
                                disabled={isLocked}
                                onClick={() => {
                                  if (isSelected) {
                                    // second click = lock in
                                    handleLockIn();
                                  } else {
                                    const next = [...userAnswers];
                                    next[currentIndex] = choice;
                                    setUserAnswers(next);
                                  }
                                }}
                                className={`w-full border-[1.5px] ${borderCls} ${bgCls} px-5 py-4 text-left flex items-center gap-4 cursor-pointer disabled:cursor-default transition-colors`}
                              >
                                <div className={`w-5 h-5 border-[1.5px] flex-shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-muted'}`} />
                                <span className="text-base text-foreground font-semibold">{choice}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <LetterBoxInput
                            value={selectedAnswer}
                            correctAnswer={currentQuestion.answer}
                            onChange={(val) => {
                              if (isLocked) return;
                              const next = [...userAnswers];
                              next[currentIndex] = val;
                              setUserAnswers(next);
                              const lettersOnly = val.replace(/[^a-zA-Z0-9]/g, '');
                              const expectedChars = currentQuestion.answer ? currentQuestion.answer.replace(/\s/g, '').length : currentQuestion.charCount;
                              if (expectedChars && lettersOnly.length === expectedChars) {
                                handleLockIn(val);
                              }
                            }}
                            charCount={currentQuestion.charCount}
                          />
                          {isLocked && (
                            <div
                              className={`w-full border-[1.5px] px-5 py-4 text-center font-bold text-base ${checkAnswer(currentQuestion, selectedAnswer)
                                ? 'border-green-500 bg-green-500/10 text-green-500'
                                : 'border-destructive bg-destructive/10 text-destructive'
                                }`}
                            >
                              {checkAnswer(currentQuestion, selectedAnswer)
                                ? '✓ CORRECT'
                                : currentQuestion.answer}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Nav buttons */}
                    <div className="flex gap-3 shrink-0 justify-end w-full">
                      <TuiButton
                        onPress={handlePrev}
                        variant="outline"
                        disabled={currentIndex === 0}
                        className="!w-auto px-4"
                      >
                        <ChevronLeft size={16} />
                      </TuiButton>
                      <TuiButton
                        onPress={handleNext}
                        variant={currentIndex + 1 === totalQ ? 'accent' : 'outline'}
                        disabled={currentQuestion.type === 'multiple_choice' && !selectedAnswer}
                        className="!w-auto px-4"
                      >
                        {currentIndex + 1 === totalQ ? 'Finish' : <ChevronRight size={16} />}
                      </TuiButton>
                    </div>
                  </div>

                </div>
              )}


              {/* ── RESULTS VIEW ──────────────────────────────────── */}
              {view === 'results' && selectedQuiz && (
                <div className="flex flex-col gap-4 h-full">
                  {/* Score banner */}
                  <TuiContainer label="Summary Sheet">
                    <div className="flex items-center gap-6 py-2">
                      <div className="border-[1.5px] border-primary w-20 h-20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-2xl font-bold text-primary">{finalScore}</span>
                        <span className="text-[10px] text-muted font-mono">OF {resultTotal}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-bold text-primary">{percentage}%</span>
                          <Trophy size={20} className={percentage >= 50 ? 'text-primary' : 'text-muted'} />
                        </div>
                        <span className="text-sm font-bold text-muted">{reviewComment}</span>
                      </div>
                    </div>
                  </TuiContainer>

                  {/* Review list */}
                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0">
                    {finalQueue.map((q, idx) => {
                      const correct = checkAnswer(q, finalAnswers[idx]);
                      const userAns = finalAnswers[idx] || '—';
                      const isRetry = selectedQuiz && idx >= selectedQuiz.questions.length;
                      return (
                        <TuiContainer
                          key={idx}
                          label={`${isRetry ? 'Retry ' : ''}Line ${String(idx + 1).padStart(2, '0')}`}
                          accentBorder={correct}
                          style={{ borderColor: correct ? '#10B981' : '#ef4444' }}
                        >
                          <p className="text-sm font-bold text-foreground mb-1">{q.question}</p>
                          <p className={`text-sm font-mono ${correct ? 'text-green-500' : 'text-destructive'}`}>
                            Input: {userAns}
                          </p>
                          {!correct && (
                            <p className="text-sm font-mono text-muted">
                              Expected:{' '}
                              <span className="text-green-500">
                                {(() => {
                                  if (q.type === 'multiple_choice' && q.choices) {
                                    const ansIdx = ['a', 'b', 'c', 'd'].indexOf(q.answer.toLowerCase().trim());
                                    if (ansIdx !== -1 && q.choices[ansIdx]) {
                                      return `${q.answer.toUpperCase()}: ${q.choices[ansIdx]}`;
                                    }
                                  }
                                  return q.answer;
                                })()}
                              </span>
                            </p>
                          )}
                        </TuiContainer>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 shrink-0">
                    <TuiButton onPress={() => setView('home')} variant="outline">
                      Return Home
                    </TuiButton>
                    <TuiButton onPress={handleRetake} variant="accent">
                      Retake Quiz
                    </TuiButton>
                  </div>
                </div>
              )}
            </TuiContainer>
          </main>
        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────── */}
      <NewQuizModal
        visible={showNewQuizModal}
        onClose={() => setShowNewQuizModal(false)}
        onCreate={handleCreateQuiz}
      />

      <AiSetupModal
        visible={showAiSetupModal}
        onClose={() => setShowAiSetupModal(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />

      <RenameQuizModal
        visible={!!renameQuizModal?.visible}
        onClose={() => setRenameQuizModal(null)}
        quizTitle={renameQuizModal?.quiz.title || ''}
        onRename={executeRenameQuiz}
      />

      <TuiAlertModal
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        isDestructive={dialog.isDestructive}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onCancel}
      />

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            top: Math.min(contextMenu.y, window.innerHeight - 150),
            zIndex: 99999,
          }}
          className="border-[1.5px] border-primary bg-card w-48 shadow-lg select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col text-xs font-bold font-mono">
            <button
              onClick={() => {
                handleRenameQuiz(contextMenu.quiz);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-primary/15 hover:text-primary cursor-pointer border-b border-border"
            >
              Rename
            </button>
            <button
              onClick={() => {
                handleExportQuiz(contextMenu.quiz);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-primary/15 hover:text-primary cursor-pointer border-b border-border"
            >
              Export (.kwiz)
            </button>
            <button
              onClick={() => {
                handleDeleteQuiz(contextMenu.quiz);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-destructive/15 text-destructive hover:text-destructive cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
