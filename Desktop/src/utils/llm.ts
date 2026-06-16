import { invoke } from '@tauri-apps/api/core';

export interface GenerateQuizOptions {
  filePath?: string;
  prompt?: string;
  questionType: 'multiple_choice' | 'identification' | 'hybrid';
  count: number;
  llamaPort: number;
}

export async function generateQuiz(opts: GenerateQuizOptions): Promise<string> {
  return invoke<string>('generate_quiz', {
    filePath: opts.filePath,
    prompt: opts.prompt,
    questionType: opts.questionType,
    count: opts.count,
    llamaPort: opts.llamaPort,
  });
}

export async function checkMarkitdown(): Promise<boolean> {
  return invoke<boolean>('check_markitdown');
}

export async function checkLlama(port: number): Promise<boolean> {
  return invoke<boolean>('check_llama', { port });
}

export async function readKwizFile(path: string): Promise<string> {
  return invoke<string>('read_kwiz_file', { path });
}

export async function writeKwizFile(path: string, content: string): Promise<void> {
  return invoke<void>('write_kwiz_file', { path, content });
}

export interface OllamaSetupStatus {
  installed: boolean;
  version?: string | null;
  model_count: number;
  has_default_model: boolean;
  winget_available: boolean;
  install_in_progress: boolean;
  managed_install: boolean;
}

export async function getOllamaSetupStatus(): Promise<OllamaSetupStatus> {
  return invoke<OllamaSetupStatus>('get_ollama_setup_status');
}

export async function launchOllamaSetupStep(action: 'install' | 'signin'): Promise<string> {
  return invoke<string>('launch_ollama_setup_step', { action });
}

export async function getOllamaInstallLog(): Promise<string | null> {
  return invoke<string | null>('get_ollama_install_log');
}

export async function startOllamaBackground(): Promise<string> {
  return invoke<string>('start_ollama_background');
}

export async function uninstallManagedOllama(): Promise<string> {
  return invoke<string>('uninstall_managed_ollama');
}



