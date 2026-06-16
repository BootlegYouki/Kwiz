export type QuizQuestion =
  | {
      type: 'multiple_choice';
      question: string;
      choices: string[];
      answer: string;
    }
  | {
      type: 'identification';
      question: string;
      answer: string;
      charCount: number;
    };

export type QuizSet = {
  id: string;
  title: string;
  subject?: string;
  createdAt: string;
  questionType: 'multiple_choice' | 'identification' | 'hybrid';
  questions: QuizQuestion[];
  source?: string;
  fileName?: string;
  status: 'generating' | 'ready' | 'error';
};

// Compact "maytoon" format
export type MaytoonQuestion = {
  k: 'mc' | 'id';
  q: string;
  c?: string[];
  a: string;
  n?: number;
};

export type MaytoonQuiz = {
  t: string;
  qs: MaytoonQuestion[];
};
