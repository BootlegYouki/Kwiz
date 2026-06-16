import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizSet } from '../types';

const STORAGE_KEY = '@kwiz_quiz_sets';

export async function getQuizzes(): Promise<QuizSet[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load quizzes:', err);
    return [];
  }
}

export async function saveQuizzes(quizzes: QuizSet[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
  } catch (err) {
    console.error('Failed to save quizzes:', err);
  }
}

export async function saveQuiz(quiz: QuizSet): Promise<void> {
  const quizzes = await getQuizzes();
  const index = quizzes.findIndex((q) => q.id === quiz.id);
  if (index >= 0) {
    quizzes[index] = quiz;
  } else {
    quizzes.unshift(quiz);
  }
  await saveQuizzes(quizzes);
}

export async function deleteQuiz(id: string): Promise<void> {
  const quizzes = await getQuizzes();
  const filtered = quizzes.filter((q) => q.id !== id);
  await saveQuizzes(filtered);
}

export async function renameQuiz(id: string, newTitle: string): Promise<void> {
  const quizzes = await getQuizzes();
  const index = quizzes.findIndex((q) => q.id === id);
  if (index >= 0) {
    quizzes[index].title = newTitle;
    await saveQuizzes(quizzes);
  }
}
