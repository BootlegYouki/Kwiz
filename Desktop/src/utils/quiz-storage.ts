import { QuizSet } from '../types';

const STORAGE_KEY = 'kwiz_quiz_sets';

export function getQuizzes(): QuizSet[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
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
