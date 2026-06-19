import type {
  MediaTendency,
  BasisOption,
  AffectedGroup,
  ConfusionType,
  PracticeQuestion,
  MediaReport,
} from '../data/types';

export function jaccard<T>(a: T[], b: T[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

export interface ScoreResult {
  score: number;
  isCorrect: boolean;
  correctTendency: MediaTendency;
}

export function calculateScore(
  userAnswer: {
    selectedTendency: MediaTendency;
    selectedBasis: BasisOption[];
    selectedAffectedGroups: AffectedGroup[];
  },
  question: PracticeQuestion,
  report: MediaReport,
): ScoreResult {
  const correctTendency = report.overallTendency;
  const tendencyScore =
    userAnswer.selectedTendency === correctTendency ? 40 : 0;

  const basisScore = Math.round(
    jaccard(userAnswer.selectedBasis, question.correctBasis) * 35,
  );

  const groupScore = Math.round(
    jaccard(
      userAnswer.selectedAffectedGroups,
      question.correctAffectedGroups,
    ) * 25,
  );

  const score = tendencyScore + basisScore + groupScore;
  const isCorrect = tendencyScore === 40;

  return { score, isCorrect, correctTendency };
}

export function classifyConfusion(
  selectedTendency: MediaTendency,
  correctTendency: MediaTendency,
  selectedBasis: BasisOption[],
  report: MediaReport,
): ConfusionType | undefined {
  if (selectedTendency === correctTendency) {
    return undefined;
  }

  const hasSource =
    report.sourceStandpoint && report.sourceStandpoint.trim().length > 0;
  const basisHasSource = selectedBasis.includes('source');
  const basisHasWording = selectedBasis.includes('wording');

  if (
    correctTendency === 'neutral' &&
    (selectedTendency === 'accountability' || selectedTendency === 'sceptical')
  ) {
    return 'fact_as_negative';
  }

  if (hasSource && !basisHasSource) {
    return 'ignore_source';
  }

  if (!basisHasWording) {
    return 'wording_sensitivity';
  }

  if (
    (correctTendency === 'neutral' && selectedTendency === 'wait_and_see') ||
    (correctTendency === 'wait_and_see' && selectedTendency === 'neutral')
  ) {
    return 'neutral_vs_wait';
  }

  if (
    (correctTendency === 'sympathy' && selectedTendency === 'sceptical') ||
    (correctTendency === 'sceptical' && selectedTendency === 'sympathy')
  ) {
    return 'sympathy_vs_sceptical';
  }

  return 'fact_as_negative';
}
