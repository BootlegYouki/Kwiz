import { invoke } from '@tauri-apps/api/core';

export interface GenerateQuizOptions {
  markdownContent: string;
  prompt?: string;
  questionType: 'multiple_choice' | 'identification' | 'hybrid';
  count: number;
  apiKey?: string;
}

export async function generateQuiz(opts: GenerateQuizOptions): Promise<string> {
  return invoke<string>('generate_quiz', {
    markdownContent: opts.markdownContent,
    prompt: opts.prompt,
    questionType: opts.questionType,
    count: opts.count,
    apiKey: opts.apiKey,
  });
}

export async function checkMarkitdown(): Promise<boolean> {
  return invoke<boolean>('check_markitdown');
}

export async function convertToMarkdown(filePath: string): Promise<string> {
  return invoke<string>('convert_to_markdown', { filePath });
}

export async function readKwizFile(path: string): Promise<string> {
  return invoke<string>('read_kwiz_file', { path });
}

export async function writeKwizFile(path: string, content: string): Promise<void> {
  return invoke<void>('write_kwiz_file', { path, content });
}
