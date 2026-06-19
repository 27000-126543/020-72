import { create } from 'zustand';
import type { UserAnswer, UserStats, MistakesMap } from '../data/types';
import {
  SafeLocalStorage,
  ANSWERS_KEY,
  STATS_KEY,
  MISTAKES_KEY,
  LAST_QUESTION_KEY,
} from '../utils/storage';
import { computeStats } from '../utils/statistics';

interface AppState {
  answers: UserAnswer[];
  stats: UserStats;
  mistakes: MistakesMap;
  lastQuestionId: string;
}

interface AppActions {
  submitAnswer: (answer: UserAnswer) => void;
  clearMistake: (key: string) => void;
  resetAll: () => void;
}

const DEFAULT_STATS: UserStats = {
  totalPracticed: 0,
  correctCount: 0,
  mistakeCount: 0,
  categoryProgress: {
    public_event: { total: 0, done: 0 },
    corporate_crisis: { total: 0, done: 0 },
    social_issue: { total: 0, done: 0 },
    international: { total: 0, done: 0 },
  },
  confusionDistribution: {
    fact_as_negative: 0,
    ignore_source: 0,
    wording_sensitivity: 0,
    neutral_vs_wait: 0,
    sympathy_vs_sceptical: 0,
  },
  dailyStreak: 0,
  lastPracticeDate: '',
  history: [],
};

function getInitialState(): AppState {
  const answers = SafeLocalStorage.get<UserAnswer[]>(ANSWERS_KEY, []);
  const stats = SafeLocalStorage.get<UserStats>(STATS_KEY, computeStats(answers));
  const mistakes = SafeLocalStorage.get<MistakesMap>(MISTAKES_KEY, {});
  const lastQuestionId = SafeLocalStorage.get<string>(LAST_QUESTION_KEY, '');

  return {
    answers,
    stats,
    mistakes,
    lastQuestionId,
  };
}

function persistAnswers(answers: UserAnswer[]) {
  SafeLocalStorage.set(ANSWERS_KEY, answers);
}

function persistStats(stats: UserStats) {
  SafeLocalStorage.set(STATS_KEY, stats);
}

function persistMistakes(mistakes: MistakesMap) {
  SafeLocalStorage.set(MISTAKES_KEY, mistakes);
}

function persistLastQuestionId(id: string) {
  SafeLocalStorage.set(LAST_QUESTION_KEY, id);
}

export const useAppStore = create<AppState & AppActions>()((set, get) => ({
  ...getInitialState(),

  submitAnswer: (answer: UserAnswer) => {
    const state = get();

    const existingIndex = state.answers.findIndex(
      (a) => a.questionId === answer.questionId && a.reportId === answer.reportId,
    );

    let newAnswers: UserAnswer[];
    if (existingIndex >= 0) {
      newAnswers = [...state.answers];
      newAnswers[existingIndex] = answer;
    } else {
      newAnswers = [...state.answers, answer];
    }

    const newStats = computeStats(newAnswers);

    const mistakeKey = `${answer.questionId}_${answer.reportId}`;
    let newMistakes: MistakesMap = { ...state.mistakes };
    if (!answer.isCorrect) {
      const existing = newMistakes[mistakeKey];
      newMistakes[mistakeKey] = {
        count: (existing?.count ?? 0) + 1,
        lastWrong: answer.answeredAt,
      };
    } else {
      if (newMistakes[mistakeKey]) {
        delete newMistakes[mistakeKey];
      }
    }

    const newLastQuestionId = answer.questionId;

    persistAnswers(newAnswers);
    persistStats(newStats);
    persistMistakes(newMistakes);
    persistLastQuestionId(newLastQuestionId);

    set({
      answers: newAnswers,
      stats: newStats,
      mistakes: newMistakes,
      lastQuestionId: newLastQuestionId,
    });
  },

  clearMistake: (key: string) => {
    const state = get();
    const newMistakes = { ...state.mistakes };
    delete newMistakes[key];
    persistMistakes(newMistakes);
    set({ mistakes: newMistakes });
  },

  resetAll: () => {
    SafeLocalStorage.remove(ANSWERS_KEY);
    SafeLocalStorage.remove(STATS_KEY);
    SafeLocalStorage.remove(MISTAKES_KEY);
    SafeLocalStorage.remove(LAST_QUESTION_KEY);

    set({
      answers: [],
      stats: DEFAULT_STATS,
      mistakes: {},
      lastQuestionId: '',
    });
  },
}));
