export type MediaTendency =
  | "sympathy"
  | "accountability"
  | "wait_and_see"
  | "sceptical"
  | "neutral";

export type QuestionCategory =
  | "public_event"
  | "corporate_crisis"
  | "social_issue"
  | "international";

export type BasisOption =
  | "wording"
  | "source"
  | "angle"
  | "headline"
  | "data";

export type AffectedGroup =
  | "government"
  | "corporate"
  | "public"
  | "vulnerable"
  | "industry"
  | "netizens";

export type ConfusionType =
  | "fact_as_negative"
  | "ignore_source"
  | "wording_sensitivity"
  | "neutral_vs_wait"
  | "sympathy_vs_sceptical";

export interface SentenceAnnotation {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  tendencyLabel?: MediaTendency;
  annotation: string;
  keywords: string[];
}

export interface MediaReport {
  id: string;
  mediaName: string;
  mediaLogo?: string;
  publishDate: string;
  headline: string;
  lead: string;
  keyParagraphs: string[];
  fullText?: string;
  overallTendency: MediaTendency;
  sentenceAnnotations: SentenceAnnotation[];
  sourceStandpoint: string;
}

export interface CommonMistake {
  wrongOption: string;
  percentage: number;
  reason: string;
  tip: string;
}

export interface PracticeQuestion {
  id: string;
  title: string;
  category: QuestionCategory;
  difficulty: 1 | 2 | 3;
  summary: string;
  reports: MediaReport[];
  correctTendency: MediaTendency;
  correctBasis: BasisOption[];
  correctAffectedGroups: AffectedGroup[];
  reasoning: string[];
  commonMistakes: CommonMistake[];
}

export interface UserAnswer {
  questionId: string;
  reportId: string;
  correctTendency: MediaTendency;
  selectedTendency: MediaTendency;
  selectedBasis: BasisOption[];
  selectedAffectedGroups: AffectedGroup[];
  isCorrect: boolean;
  score: number;
  answeredAt: number;
  confusionType?: ConfusionType;
}

export interface UserStats {
  totalPracticed: number;
  correctCount: number;
  mistakeCount: number;
  categoryProgress: Record<
    QuestionCategory,
    { total: number; done: number }
  >;
  confusionDistribution: Record<ConfusionType, number>;
  dailyStreak: number;
  lastPracticeDate: string;
  history: Array<{ date: string; correct: number; total: number }>;
}

export type MistakeRecord = {
  count: number;
  lastWrong: number;
};

export type MistakesMap = Record<string, MistakeRecord>;

export const TENDENCY_COLORS: Record<MediaTendency, string> = {
  sympathy: "#4a90d9",
  accountability: "#c94a4a",
  wait_and_see: "#8e7cc3",
  sceptical: "#d4a017",
  neutral: "#3d8b5c",
};

export const TENDENCY_LABELS: Record<MediaTendency, string> = {
  sympathy: "同情",
  accountability: "追责",
  wait_and_see: "观望",
  sceptical: "引导质疑",
  neutral: "中立客观",
};

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  public_event: "公共事件",
  corporate_crisis: "企业危机",
  social_issue: "社会议题",
  international: "国际报道",
};
