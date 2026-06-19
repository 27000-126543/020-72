import type {
  UserAnswer,
  UserStats,
  QuestionCategory,
  ConfusionType,
  PracticeQuestion,
} from '../data/types';

const ALL_CATEGORIES: QuestionCategory[] = [
  'public_event',
  'corporate_crisis',
  'social_issue',
  'international',
];

const ALL_CONFUSION_TYPES: ConfusionType[] = [
  'fact_as_negative',
  'ignore_source',
  'wording_sensitivity',
  'neutral_vs_wait',
  'sympathy_vs_sceptical',
];

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeHistory(
  answers: UserAnswer[],
): Array<{ date: string; correct: number; total: number }> {
  const map = new Map<
    string,
    { correct: number; total: number }
  >();

  for (const a of answers) {
    const date = formatDate(a.answeredAt);
    const entry = map.get(date) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (a.isCorrect) entry.correct += 1;
    map.set(date, entry);
  }

  const dates = Array.from(map.keys()).sort();
  return dates.map((date) => ({ date, ...map.get(date)! }));
}

export function computeDailyStreak(answers: UserAnswer[]): number {
  if (answers.length === 0) return 0;

  const dateSet = new Set<string>();
  for (const a of answers) {
    dateSet.add(formatDate(a.answeredAt));
  }

  let streak = 0;
  const today = new Date();
  const cursor = new Date(today);

  while (true) {
    const dateStr = formatDate(cursor.getTime());
    if (dateSet.has(dateStr)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        const yesterday = formatDate(cursor.getTime());
        if (dateSet.has(yesterday)) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  return streak;
}

export function computeStats(
  answers: UserAnswer[],
  questions: PracticeQuestion[] = [],
): UserStats {
  const totalPracticed = answers.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const mistakeCount = totalPracticed - correctCount;

  const categoryProgress: UserStats['categoryProgress'] = {
    public_event: { total: 0, done: 0 },
    corporate_crisis: { total: 0, done: 0 },
    social_issue: { total: 0, done: 0 },
    international: { total: 0, done: 0 },
  };

  for (const q of questions) {
    if (categoryProgress[q.category]) {
      categoryProgress[q.category].total += 1;
    }
  }

  const doneQuestions = new Set<string>();
  for (const a of answers) {
    if (a.isCorrect) {
      doneQuestions.add(a.questionId);
    }
  }
  for (const q of questions) {
    if (doneQuestions.has(q.id) && categoryProgress[q.category]) {
      categoryProgress[q.category].done += 1;
    }
  }

  for (const cat of ALL_CATEGORIES) {
    if (!categoryProgress[cat]) {
      categoryProgress[cat] = { total: 0, done: 0 };
    }
  }

  const confusionDistribution: UserStats['confusionDistribution'] = {
    fact_as_negative: 0,
    ignore_source: 0,
    wording_sensitivity: 0,
    neutral_vs_wait: 0,
    sympathy_vs_sceptical: 0,
  };

  for (const a of answers) {
    if (a.confusionType) {
      confusionDistribution[a.confusionType] =
        (confusionDistribution[a.confusionType] ?? 0) + 1;
    }
  }

  for (const ct of ALL_CONFUSION_TYPES) {
    if (typeof confusionDistribution[ct] !== 'number') {
      confusionDistribution[ct] = 0;
    }
  }

  const history = computeHistory(answers);
  const dailyStreak = computeDailyStreak(answers);

  let lastPracticeDate = '';
  if (answers.length > 0) {
    const latest = Math.max(...answers.map((a) => a.answeredAt));
    lastPracticeDate = formatDate(latest);
  }

  return {
    totalPracticed,
    correctCount,
    mistakeCount,
    categoryProgress,
    confusionDistribution,
    dailyStreak,
    lastPracticeDate,
    history,
  };
}
