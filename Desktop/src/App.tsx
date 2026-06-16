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
  checkLlama,
  readKwizFile,
  writeKwizFile,
  getOllamaSetupStatus,
  launchOllamaSetupStep,
  getOllamaInstallLog,
  startOllamaBackground,
  uninstallManagedOllama,
  OllamaSetupStatus
} from './utils/llm';
import { parseMaytoon } from './utils/quiz-parser';


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
  return !!answer && answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
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
      className={`w-full border-[1.5px] px-4 py-3 text-left flex flex-col gap-1 cursor-pointer select-none transition-all ${
        isSelected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-foreground hover:border-primary hover:bg-primary/5'
      } ${isGenerating ? 'opacity-60 cursor-not-allowed animate-pulse' : ''} ${
        isError ? 'border-destructive bg-destructive/10 text-destructive/90 cursor-default' : ''
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

interface NewQuizModalProps {
  visible: boolean;
  onClose: () => void;
  llamaPort: number;
  setLlamaPort: (port: number) => void;
  llamaAvailable: boolean | null;
  markitdownAvailable: boolean | null;
  onCreate: (config: {
    questionType: QuizSet['questionType'];
    count: number;
    customPrompt: string;
    attachment: { name: string; path: string } | null;
  }) => void;
}

const NewQuizModal: React.FC<NewQuizModalProps> = ({
  visible,
  onClose,
  llamaPort,
  setLlamaPort,
  llamaAvailable,
  markitdownAvailable,
  onCreate,
}) => {
  const [questionType, setQuestionType] = useState<QuizSet['questionType']>('multiple_choice');
  const [count, setCount] = useState(10);
  const [customPrompt, setCustomPrompt] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; path: string } | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuestionType('multiple_choice');
      setCount(10);
      setCustomPrompt('');
      setAttachment(null);
    }
  }, [visible]);

  const handlePickFile = async () => {
    try {
      const selected = await open({
        filters: [{
          name: 'Quiz Documents',
          extensions: ['pdf', 'pptx', 'kwiz']
        }]
      });
      if (selected && typeof selected === 'string') {
        const name = selected.split(/[\\/]/).pop() || selected;
        setAttachment({
          name,
          path: selected
        });
      }
    } catch (err) {
      console.error('Failed to open file dialog:', err);
    }
  };

  if (!visible) return null;

  const isKwizFile = !!(attachment && attachment.name.endsWith('.kwiz'));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 select-none animate-in fade-in duration-100">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col">
        <TuiContainer
          label="New Quiz — Details"
          disableHover={true}
          style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
          contentStyle={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', padding: '20px' }}
        >
          {/* 1. Attachment */}
          <div className="flex flex-col gap-1.5">
            {attachment ? (
              <div className="flex items-center justify-between border-[1.5px] border-primary bg-primary/5 p-3">
                <div className="flex-1 truncate mr-2">
                  <span className="text-sm font-bold text-foreground truncate block">{attachment.name}</span>
                  {attachment.name.endsWith('.pptx') && (
                    <span className="text-[10px] text-primary font-bold font-mono">* PPTX (will convert via markitdown)</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1 hover:bg-destructive/10 text-destructive cursor-pointer transition-colors"
                  title="Remove file"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePickFile}
                className="w-full border-[1.5px] border-dashed border-primary text-primary py-3.5 hover:bg-primary/10 cursor-pointer text-xs font-bold transition-all text-center"
              >
                Attach PDF, PPTX or .kwiz
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

          {/* 4. Connection Status & Config */}
          <div className="border-[1.5px] border-border p-3 flex flex-col gap-2 bg-card/30">
            <span className="text-[10px] uppercase font-bold text-muted">Connection Status</span>
            
            <div className="flex flex-wrap items-center justify-between gap-4 text-[11px]">
              <div className="flex items-center gap-1.5 font-mono">
                <span>markitdown:</span>
                {markitdownAvailable === null ? (
                  <span className="text-muted">checking...</span>
                ) : markitdownAvailable ? (
                  <span className="text-green-500 font-bold">FOUND</span>
                ) : (
                  <span className="text-destructive font-bold">NOT FOUND</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 font-mono">
                <span>Local AI:</span>
                {llamaAvailable === null ? (
                  <span className="text-muted">checking...</span>
                ) : llamaAvailable ? (
                  <span className="text-green-500 font-bold">ONLINE</span>
                ) : (
                  <span className="text-destructive font-bold">OFFLINE</span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-muted">Port:</span>
                <input
                  type="number"
                  value={llamaPort}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 8080;
                    setLlamaPort(val);
                    localStorage.setItem('kwiz_llama_port', val.toString());
                  }}
                  className="w-16 border-[1.5px] border-border bg-card px-1.5 py-0.5 text-center font-mono text-[11px] focus:outline-none focus:border-primary text-foreground"
                />
              </div>
            </div>
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
                onPress={() => {
                  onCreate({
                    questionType,
                    count,
                    customPrompt,
                    attachment,
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
  llamaPort: number;
  setLlamaPort: (port: number) => void;
  llamaAvailable: boolean | null;
  ollamaServiceOnline: boolean | null;
  markitdownAvailable: boolean | null;
}

const AiSetupModal: React.FC<AiSetupModalProps> = ({
  visible,
  onClose,
  llamaPort,
  setLlamaPort,
  llamaAvailable,
  ollamaServiceOnline,
  markitdownAvailable,
}) => {
  const [status, setStatus] = useState<OllamaSetupStatus | null>(null);
  const [installLog, setInstallLog] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const refreshStatus = async () => {
    try {
      const s = await getOllamaSetupStatus();
      setStatus(s);
    } catch (err: any) {
      console.error('Failed to get Ollama status:', err);
    }
  };

  const refreshLog = async () => {
    try {
      const log = await getOllamaInstallLog();
      setInstallLog(log || '');
    } catch (err: any) {
      console.error('Failed to get Ollama log:', err);
    }
  };

  useEffect(() => {
    if (!visible) return;
    refreshStatus();
    refreshLog();

    const interval = setInterval(() => {
      refreshStatus();
      refreshLog();
    }, 1500);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const handleInstall = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      await launchOllamaSetupStep('install');
      await refreshStatus();
    } catch (err: any) {
      setErrorMsg(err?.message || err || 'Failed to start install');
    } finally {
      setBusy(false);
    }
  };

  const handleSignin = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      await launchOllamaSetupStep('signin');
      await refreshStatus();
    } catch (err: any) {
      setErrorMsg(err?.message || err || 'Failed to start signin');
    } finally {
      setBusy(false);
    }
  };

  const handleStartBackground = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      await startOllamaBackground();
      await refreshStatus();
    } catch (err: any) {
      setErrorMsg(err?.message || err || 'Failed to start Ollama');
    } finally {
      setBusy(false);
    }
  };

  const handleUninstall = async () => {
    if (!confirm('Are you sure you want to uninstall managed Ollama and clear your local login session?')) return;
    setBusy(true);
    setErrorMsg('');
    try {
      await uninstallManagedOllama();
      setInstallLog('');
      await refreshStatus();
    } catch (err: any) {
      setErrorMsg(err?.message || err || 'Failed to uninstall Ollama');
    } finally {
      setBusy(false);
    }
  };

  // Reused progress parser from POS
  const getInstallProgress = () => {
    const lines = installLog.split('\n').map(l => l.trim()).filter(Boolean);
    const latest = lines.at(-1) || '';
    const norm = latest.toLowerCase();

    if (!latest) return { label: 'Preparing lightweight Ollama setup...', val: 8 };
    if (norm.includes('install failed')) return { label: latest, val: 100 };
    if (norm.includes('started ollama serve')) return { label: 'Ollama service started.', val: 100 };

    if (norm.includes('starting lightweight ollama install')) return { label: 'Preparing installer...', val: 15 };
    if (norm.includes('downloading standalone zip')) return { label: 'Downloading Ollama standalone zip...', val: 45 };
    if (norm.includes('extracting zip')) return { label: 'Extracting Ollama files...', val: 75 };
    if (norm.includes('starting ollama serve')) return { label: 'Starting Ollama service...', val: 90 };

    return { label: latest, val: 50 };
  };

  const progress = getInstallProgress();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 select-none animate-in fade-in duration-100">
      <div className="w-full max-w-md">
        <TuiContainer
          label="Ollama / Local AI Setup"
          disableHover={true}
          contentStyle={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}
        >
          <div className="flex flex-col gap-3 font-mono text-xs">
            <p className="text-[11px] text-muted leading-relaxed mb-1">
              Kwiz can download a lightweight Ollama setup, run the service, and handle your sign-in directly.
            </p>

            {/* 1. Status Details */}
            <div className="flex flex-col gap-2 border-[1.5px] border-border p-3 bg-card/30">
              <span className="text-[10px] uppercase font-bold text-muted">Service & CLI Status</span>
              
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span>markitdown (Parser):</span>
                  {markitdownAvailable ? (
                    <span className="text-green-500 font-bold">FOUND</span>
                  ) : (
                    <span className="text-destructive font-bold">NOT FOUND</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>Ollama CLI:</span>
                  {status?.installed ? (
                    <span className="text-green-500 font-bold">INSTALLED</span>
                  ) : status?.install_in_progress ? (
                    <span className="text-yellow-500 font-bold animate-pulse">INSTALLING</span>
                  ) : (
                    <span className="text-destructive font-bold">NOT FOUND</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>Ollama Service (Port 11434):</span>
                  {ollamaServiceOnline ? (
                    <span className="text-green-500 font-bold">ONLINE</span>
                  ) : (
                    <span className="text-destructive font-bold">OFFLINE</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>Ollama Cloud:</span>
                  {status?.signed_in ? (
                    <span className="text-green-500 font-bold">SIGNED IN</span>
                  ) : (
                    <span className="text-muted">NOT SIGNED IN</span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Installation / Progress View */}
            {status?.install_in_progress && (
              <div className="flex flex-col gap-2 border-[1.5px] border-yellow-500/50 p-3 bg-yellow-500/5">
                <span className="text-[10px] uppercase font-bold text-yellow-500">Installation Progress</span>
                <span className="text-[10px] truncate">{progress.label}</span>
                <div className="w-full bg-border h-1.5 overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full transition-all duration-300"
                    style={{ width: `${progress.val}%` }}
                  />
                </div>
              </div>
            )}

            {/* 3. Error Alert */}
            {errorMsg && (
              <div className="text-[11px] text-destructive border border-destructive p-2.5 bg-destructive/10 leading-relaxed font-bold">
                ERROR: {errorMsg}
              </div>
            )}

            {/* 4. Action Controls */}
            <div className="flex flex-col gap-2 border-[1.5px] border-border p-3 bg-card/30">
              <span className="text-[10px] uppercase font-bold text-muted">Controls</span>
              <div className="flex flex-col gap-2">
                {!status?.installed && !status?.install_in_progress && (
                  <button
                    onClick={handleInstall}
                    disabled={busy}
                    className="w-full border-[1.5px] border-primary text-primary py-2 px-3 text-xs font-bold hover:bg-primary/20 cursor-pointer disabled:opacity-50"
                  >
                    Download & Install Ollama (Standalone)
                  </button>
                )}

                {status?.installed && !ollamaServiceOnline && (
                  <button
                    onClick={handleStartBackground}
                    disabled={busy}
                    className="w-full border-[1.5px] border-primary text-primary py-2 px-3 text-xs font-bold hover:bg-primary/20 cursor-pointer disabled:opacity-50"
                  >
                    Start Ollama Service
                  </button>
                )}

                {status?.installed && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSignin}
                      disabled={busy}
                      className="flex-1 border-[1.5px] border-border text-foreground py-2 px-3 text-xs font-bold hover:border-primary hover:bg-primary/5 cursor-pointer disabled:opacity-50"
                    >
                      {status.signed_in ? 'Signed In (Re-auth)' : 'Sign-In (Ollama Cloud)'}
                    </button>
                    {status.managed_install && (
                      <button
                        onClick={handleUninstall}
                        disabled={busy}
                        className="border-[1.5px] border-destructive text-destructive py-2 px-3 text-xs font-bold hover:bg-destructive/10 cursor-pointer disabled:opacity-50"
                      >
                        Uninstall
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 5. Custom Port Configuration */}
            <div className="flex items-center justify-between border-[1.5px] border-border p-3 bg-card/30">
              <span className="text-[10px] uppercase font-bold text-muted">API Port Configuration</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted text-[10px]">Port:</span>
                <input
                  type="number"
                  value={llamaPort}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 8080;
                    setLlamaPort(val);
                    localStorage.setItem('kwiz_llama_port', val.toString());
                  }}
                  className="w-20 border-[1.5px] border-border bg-card px-2 py-0.5 text-center font-mono text-xs focus:outline-none focus:border-primary text-foreground"
                />
              </div>
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
  const [llamaPort, setLlamaPort] = useState<number>(() => {
    const p = localStorage.getItem('kwiz_llama_port');
    return p ? parseInt(p) : 8080;
  });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    quiz: QuizSet;
  } | null>(null);
  const [renameQuizModal, setRenameQuizModal] = useState<{
    visible: boolean;
    quiz: QuizSet;
  } | null>(null);
  const [llamaAvailable, setLlamaAvailable] = useState<boolean | null>(null);
  const [ollamaServiceOnline, setOllamaServiceOnline] = useState<boolean | null>(null);
  const [markitdownAvailable, setMarkitdownAvailable] = useState<boolean | null>(null);
  const [showAiSetupModal, setShowAiSetupModal] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      checkMarkitdown().then(setMarkitdownAvailable);
      checkLlama(llamaPort).then(setLlamaAvailable);
      checkLlama(11434).then((online) => {
        setOllamaServiceOnline(online);
        if (online && llamaPort === 8080) {
          setLlamaPort(11434);
          localStorage.setItem('kwiz_llama_port', '11434');
        }
      });
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [llamaPort]);

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
  }>({ visible: false, title: '', message: '', type: 'alert', onConfirm: () => {} });

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

  const handleLockIn = () => {
    const next = [...lockedStates];
    next[currentIndex] = true;
    setLockedStates(next);
  };

  const handleNext = () => {
    if (!selectedQuiz) return;
    const q = questionQueue[currentIndex];
    const isCorrect = checkAnswer(q, userAnswers[currentIndex]);

    let newQueue = questionQueue;
    let newAnswers = userAnswers;
    let newLocked = lockedStates;

    if (retryMode && !isCorrect) {
      newQueue = [...questionQueue, q];
      newAnswers = [...userAnswers, ''];
      newLocked = [...lockedStates, false];
      setQuestionQueue(newQueue);
      setUserAnswers(newAnswers);
      setLockedStates(newLocked);
    }

    if (currentIndex + 1 < newQueue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      let score = 0;
      newQueue.forEach((qq, i) => { if (checkAnswer(qq, newAnswers[i])) score++; });
      setFinalScore(score);
      setFinalAnswers([...newAnswers]);
      setFinalQueue([...newQueue]);
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
    attachment: { name: string; path: string } | null;
  }) => {
    if (config.attachment && config.attachment.name.endsWith('.kwiz')) {
      readKwizFile(config.attachment.path)
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

    const updatedQuizzes = [tempQuiz, ...quizzes];
    saveAndSet(updatedQuizzes);
    setSelectedQuizId(quizId);
    setShowNewQuizModal(false);

    generateQuiz({
      filePath: config.attachment?.path,
      prompt: config.customPrompt || undefined,
      questionType: config.questionType,
      count: config.count,
      llamaPort,
    })
      .then((rawJson) => {
        try {
          // Parse maytoon JSON
          const parsed = parseMaytoon(rawJson, {
            count: config.count,
            type: config.questionType,
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
          console.error('Failed to parse Maytoon JSON:', rawJson, parseErr);
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
            <div className="flex items-center justify-between gap-6 py-1 select-none">
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
                className="w-9 h-9 flex items-center justify-center border-[1.5px] border-border hover:bg-primary/10 active:scale-95 cursor-pointer select-none shrink-0"
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
                className={`w-full border-[1.5px] py-3 px-4 flex items-center justify-center gap-2 cursor-pointer text-sm font-bold active:scale-95 shrink-0 transition-all ${
                  view === 'home'
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

            {/* ── LOCAL AI STATUS ────────────────────────────────────────── */}
            <TuiContainer
              label="Local AI Status"
              disableHover={true}
              style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}
              contentStyle={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}
            >
              {llamaAvailable || ollamaServiceOnline ? (
                <div className="flex flex-col gap-2 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Status:</span>
                    <span className="text-green-500 font-bold">ONLINE</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Port:</span>
                    <span className="text-foreground font-bold">{llamaAvailable ? llamaPort : 11434}</span>
                  </div>
                  <button
                    onClick={() => setShowAiSetupModal(true)}
                    className="w-full border-[1.5px] border-border text-foreground py-2 px-3 text-xs font-bold hover:border-primary hover:bg-primary/5 cursor-pointer transition-all active:scale-98"
                  >
                    Ollama Setup
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 font-mono">
                  <div className="text-[11px] text-muted leading-relaxed">
                    Offline. Start Ollama to generate quizzes.
                  </div>
                  <button
                    onClick={() => setShowAiSetupModal(true)}
                    className="w-full border-[1.5px] border-primary text-primary py-2 px-3 text-xs font-bold hover:bg-primary/20 cursor-pointer transition-all active:scale-98"
                  >
                    Setup Local AI
                  </button>
                </div>
              )}
            </TuiContainer>
          </aside>

          {/* ── MAIN CONTENT ────────────────────────────────────────── */}
          <main className="flex-1 min-h-0 min-w-0 flex flex-col">
            <TuiContainer
              label={
                view === 'playing' && selectedQuiz
                  ? `Playing — ${selectedQuiz.title}`
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
                            className={`border-[1.5px] p-4 flex flex-col justify-between text-left cursor-pointer select-none transition-all ${
                              isGenerating ? 'border-border opacity-60 cursor-not-allowed animate-pulse' :
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
                          className={`w-full border-[1.5px] px-3 py-2 text-sm font-bold font-mono transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                            retryMode ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-border text-muted hover:border-foreground hover:text-foreground'
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
                            onChange={(val) => {
                              if (isLocked) return;
                              const next = [...userAnswers];
                              next[currentIndex] = val;
                              setUserAnswers(next);
                              // auto-lock when all boxes filled
                              if (currentQuestion.charCount && val.length === currentQuestion.charCount) {
                                handleLockIn();
                              }
                            }}
                            charCount={currentQuestion.charCount}
                          />
                          {isLocked && (
                            <div
                              className={`w-full border-[1.5px] px-5 py-4 text-center font-bold text-base ${
                                checkAnswer(currentQuestion, selectedAnswer)
                                  ? 'border-green-500 bg-green-500/10 text-green-500'
                                  : 'border-destructive bg-destructive/10 text-destructive'
                              }`}
                            >
                              {checkAnswer(currentQuestion, selectedAnswer)
                                ? '✓ CORRECT'
                                : `✗ ${currentQuestion.answer}`}
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
                        disabled={!isLocked}
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
                              Expected: <span className="text-green-500">{q.answer}</span>
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
        llamaPort={llamaPort}
        setLlamaPort={setLlamaPort}
        llamaAvailable={llamaAvailable}
        markitdownAvailable={markitdownAvailable}
        onCreate={handleCreateQuiz}
      />

      <AiSetupModal
        visible={showAiSetupModal}
        onClose={() => setShowAiSetupModal(false)}
        llamaPort={llamaPort}
        setLlamaPort={setLlamaPort}
        llamaAvailable={llamaAvailable}
        ollamaServiceOnline={ollamaServiceOnline}
        markitdownAvailable={markitdownAvailable}
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
