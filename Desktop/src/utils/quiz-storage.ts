import { QuizSet } from '../types';

const STORAGE_KEY = 'kwiz_quiz_sets';

const SAMPLE_QUIZ: QuizSet = {
  id: 'photosynthesis-101',
  title: 'Photosynthesis 101',
  subject: 'Science',
  createdAt: new Date('2026-06-14T09:00:00Z').toISOString(),
  questionType: 'hybrid',
  status: 'ready',
  questions: [
    {
      type: 'multiple_choice',
      question: 'What gas do plants absorb during photosynthesis?',
      choices: ['O2', 'CO2', 'N2', 'H2'],
      answer: 'CO2',
    },
    {
      type: 'identification',
      question: 'The pigment that captures light is called ___.',
      answer: 'chlorophyll',
      charCount: 11,
    },
    {
      type: 'multiple_choice',
      question: 'Where in the plant cell does photosynthesis take place?',
      choices: ['Mitochondria', 'Chloroplast', 'Nucleus', 'Ribosome'],
      answer: 'Chloroplast',
    },
    {
      type: 'identification',
      question: 'What is the main energy currency of cells produced in light-dependent reactions?',
      answer: 'ATP',
      charCount: 3,
    },
  ],
};

export function getQuizzes(): QuizSet[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      saveQuizzes([SAMPLE_QUIZ]);
      return [SAMPLE_QUIZ];
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load quizzes:', err);
    return [];
  }
}

export function saveQuizzes(quizzes: QuizSet[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
  } catch (err) {
    console.error('Failed to save quizzes:', err);
  }
}

export function saveQuiz(quiz: QuizSet): void {
  const quizzes = getQuizzes();
  const index = quizzes.findIndex((q) => q.id === quiz.id);
  if (index >= 0) {
    quizzes[index] = quiz;
  } else {
    quizzes.unshift(quiz);
  }
  saveQuizzes(quizzes);
}

export function deleteQuiz(id: string): void {
  const quizzes = getQuizzes();
  const filtered = quizzes.filter((q) => q.id !== id);
  saveQuizzes(filtered);
}

export function renameQuiz(id: string, newTitle: string): void {
  const quizzes = getQuizzes();
  const index = quizzes.findIndex((q) => q.id === id);
  if (index >= 0) {
    quizzes[index].title = newTitle;
    saveQuizzes(quizzes);
  }
}
