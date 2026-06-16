import { QuizSet, QuizQuestion, MaytoonQuiz } from '../types';

export function parseMaytoon(jsonStr: string, options: { id: string; createdAt: string; questionType: QuizSet['questionType']; source?: string; fileName?: string }): QuizSet {
  try {
    const parsed: MaytoonQuiz = JSON.parse(jsonStr);
    
    const questions: QuizQuestion[] = (parsed.qs || []).map((q) => {
      if (q.k === 'mc') {
        return {
          type: 'multiple_choice',
          question: q.q,
          choices: q.c || [],
          answer: q.a,
        };
      } else {
        return {
          type: 'identification',
          question: q.q,
          answer: q.a,
          charCount: q.n || q.a.length,
        };
      }
    });

    return {
      id: options.id,
      title: parsed.t || 'Untitled Quiz',
      createdAt: options.createdAt,
      questionType: options.questionType,
      questions,
      source: options.source,
      fileName: options.fileName,
      status: 'ready',
    };
  } catch (err) {
    console.error('Failed to parse maytoon quiz JSON:', err);
    return {
      id: options.id,
      title: 'Failed to generate quiz',
      createdAt: options.createdAt,
      questionType: options.questionType,
      questions: [],
      source: options.source,
      fileName: options.fileName,
      status: 'error',
    };
  }
}
