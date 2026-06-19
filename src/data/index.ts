import type { PracticeQuestion } from './types';

import { q01_rainstorm } from './questions/q01_rainstorm';
import { q02_metro } from './questions/q02_metro';
import { q03_car_fire } from './questions/q03_car_fire';
import { q04_food_safety } from './questions/q04_food_safety';
import { q05_retirement } from './questions/q05_retirement';
import { q06_school } from './questions/q06_school';
import { q07_trade } from './questions/q07_trade';
import { q08_climate } from './questions/q08_climate';

export * from './types';

export const questions: PracticeQuestion[] = [
  q01_rainstorm,
  q02_metro,
  q03_car_fire,
  q04_food_safety,
  q05_retirement,
  q06_school,
  q07_trade,
  q08_climate,
];

export const getQuestionById = (id: string): PracticeQuestion | undefined => {
  return questions.find(q => q.id === id);
};

export const getQuestionsByCategory = (category: string): PracticeQuestion[] => {
  return questions.filter(q => q.category === category);
};

export const getQuestionsByDifficulty = (difficulty: number): PracticeQuestion[] => {
  return questions.filter(q => q.difficulty === difficulty);
};

export const getQuestionsByTendency = (tendency: string): PracticeQuestion[] => {
  return questions.filter(q => q.correctTendency === tendency);
};

export {
  q01_rainstorm,
  q02_metro,
  q03_car_fire,
  q04_food_safety,
  q05_retirement,
  q06_school,
  q07_trade,
  q08_climate,
};
