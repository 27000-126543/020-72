import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  BookOpen,
  PlayCircle,
  Check,
  Trophy,
  Target,
  TrendingUp,
  Home,
  AlertCircle,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TendencyTag from "@/components/ui/TendencyTag";
import Chip from "@/components/ui/Chip";
import RadioCard from "@/components/ui/RadioCard";
import ReportViewer from "@/components/ReportViewer/ReportViewer";
import Empty from "@/components/ui/Empty";
import type {
  ConfusionType,
  MediaTendency,
  MediaReport,
  PracticeQuestion,
  UserAnswer,
  BasisOption,
  AffectedGroup,
} from "@/data/types";
import { TENDENCY_LABELS } from "@/data/types";
import { getQuestionById } from "@/data";
import { classifyConfusion, calculateScore } from "@/utils/scoring";
import { cn } from "@/lib/utils";

const CONFUSION_TYPE_LABELS: Record<ConfusionType, string> = {
  fact_as_negative: "事实陈述误判为负面倾向",
  ignore_source: "忽略消息源立场",
  wording_sensitivity: "措辞敏感度不足",
  neutral_vs_wait: "中立客观与观望混淆",
  sympathy_vs_sceptical: "同情报道与引导质疑混淆",
};

const CONFUSION_TYPE_COLORS: Record<ConfusionType, string> = {
  fact_as_negative: "#c94a4a",
  ignore_source: "#d4a017",
  wording_sensitivity: "#4a90d9",
  neutral_vs_wait: "#8e7cc3",
  sympathy_vs_sceptical: "#3d8b5c",
};

const TENDENCY_OPTIONS: {
  value: MediaTendency;
  label: string;
  description: string;
}[] = [
  {
    value: "sympathy",
    label: "同情",
    description: "关注弱势群体困境，唤起读者共情",
  },
  {
    value: "accountability",
    label: "追责",
    description: "追问责任主体，推动问责反思",
  },
  {
    value: "wait_and_see",
    label: "观望",
    description: "强调不确定性，等待事态发展",
  },
  {
    value: "sceptical",
    label: "引导质疑",
    description: "挑战既有认知，引导深层反思",
  },
  {
    value: "neutral",
    label: "中立客观",
    description: "多方观点平衡，数据事实为主",
  },
];

interface ReviewItem {
  key: string;
  question: PracticeQuestion;
  report: MediaReport;
  previousWrongTendency: MediaTendency;
  errorCount: number;
}

interface ReviewResult {
  key: string;
  isCorrect: boolean;
  selectedTendency: MediaTendency;
  correctTendency: MediaTendency;
}

export default function MistakesReviewPage() {
  const navigate = useNavigate();
  const params = useParams<{ type: string }>();
  const type = params.type as ConfusionType;

  const { mistakes, answers, submitAnswer } = useAppStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTendency, setSelectedTendency] = useState<MediaTendency | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const reviewItems = useMemo<ReviewItem[]>(() => {
    if (!type) return [];

    const items: ReviewItem[] = [];
    const processed = new Set<string>();

    for (const [key, record] of Object.entries(mistakes)) {
      const [questionId, reportId] = key.split("_");
      const question = getQuestionById(questionId);
      if (!question) continue;
      const report = question.reports.find((r) => r.id === reportId);
      if (!report) continue;

      const relatedWrongAnswers = answers.filter(
        (a) =>
          a.questionId === questionId &&
          a.reportId === reportId &&
          !a.isCorrect
      );

      if (relatedWrongAnswers.length === 0) continue;

      const latestWrong = relatedWrongAnswers.reduce((prev, curr) =>
        curr.answeredAt > prev.answeredAt ? curr : prev
      );

      if (latestWrong.confusionType !== type) continue;

      if (processed.has(key)) continue;
      processed.add(key);

      items.push({
        key,
        question,
        report,
        previousWrongTendency: latestWrong.selectedTendency,
        errorCount: record.count,
      });
    }

    return items;
  }, [type, mistakes, answers]);

  const totalItems = reviewItems.length;
  const currentItem = reviewItems[currentIndex];

  const handleSubmit = () => {
    if (!selectedTendency || !currentItem || submitted) return;

    const { question, report, key } = currentItem;

    const isCorrect = selectedTendency === report.overallTendency;

    const dummyBasis: BasisOption[] = ["wording"];
    const dummyGroups: AffectedGroup[] = ["public"];

    const { score } = calculateScore(
      {
        selectedTendency,
        selectedBasis: dummyBasis,
        selectedAffectedGroups: dummyGroups,
      },
      question
    );

    const confusionType = classifyConfusion(
      selectedTendency,
      report.overallTendency,
      dummyBasis,
      question
    );

    const newAnswer: UserAnswer = {
      questionId: question.id,
      reportId: report.id,
      selectedTendency,
      selectedBasis: dummyBasis,
      selectedAffectedGroups: dummyGroups,
      isCorrect,
      score,
      answeredAt: Date.now(),
      confusionType,
    };

    submitAnswer(newAnswer);

    setResults((prev) => [
      ...prev,
      {
        key,
        isCorrect,
        selectedTendency,
        correctTendency: report.overallTendency,
      },
    ]);

    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentIndex >= totalItems - 1) {
      setIsFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedTendency(null);
    setSubmitted(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedTendency(null);
    setSubmitted(false);
    setResults([]);
    setIsFinished(false);
  };

  useEffect(() => {
    if (totalItems === 0) {
      setIsFinished(true);
    }
  }, [totalItems]);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const removedCount = correctCount;
  const accuracy =
    results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  if (totalItems === 0 && !isFinished) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate("/mistakes")}
          >
            返回错题本
          </Button>
        </div>
        <Card>
          <CardContent className="py-10">
            <Empty
              icon={BookOpen}
              title="该类型暂无错题"
              description="没有找到该混淆类型的错题，你可以返回错题本查看其他类型。"
              action={{
                label: "返回错题本",
                icon: <Home className="w-4 h-4" />,
                onClick: () => navigate("/mistakes"),
                variant: "primary",
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate("/mistakes")}
          >
            返回错题本
          </Button>
        </div>

        <Card className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-card mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">练习完成！</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
              {type && (
                <Chip
                  variant="solid"
                  color="primary"
                  className="!text-sm !h-8 !px-3"
                  style={{
                    backgroundColor: CONFUSION_TYPE_COLORS[type],
                  }}
                >
                  {CONFUSION_TYPE_LABELS[type]}
                </Chip>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-white shadow-soft border-primary-100">
                <CardContent className="py-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-primary-100 flex items-center justify-center mb-2">
                    <Target className="w-5 h-5 text-primary-600" />
                  </div>
                  <p className="text-xs text-primary-500 mb-1">正确率</p>
                  <p className="text-3xl font-bold text-primary-800 font-mono">
                    {accuracy}
                    <span className="text-lg">%</span>
                  </p>
                  <p className="text-xs text-primary-400 mt-1">
                    {correctCount} / {results.length} 题正确
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-soft border-primary-100">
                <CardContent className="py-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-primary-500 mb-1">已移除错题</p>
                  <p className="text-3xl font-bold text-emerald-600 font-mono">
                    {removedCount}
                  </p>
                  <p className="text-xs text-primary-400 mt-1">
                    从错题本中清除
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-soft border-primary-100">
                <CardContent className="py-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-accent-100 flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-accent-600" />
                  </div>
                  <p className="text-xs text-primary-500 mb-1">仍需巩固</p>
                  <p className="text-3xl font-bold text-accent-600 font-mono">
                    {results.length - correctCount}
                  </p>
                  <p className="text-xs text-primary-400 mt-1">
                    继续留在错题本
                  </p>
                </CardContent>
              </Card>
            </div>

            {results.length > 0 && (
              <div className="rounded-xl border border-primary-100 bg-white overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-primary-100 bg-primary-50/50">
                  <p className="text-sm font-semibold text-primary-700">
                    逐题详情
                  </p>
                </div>
                <div className="divide-y divide-primary-50 max-h-80 overflow-y-auto">
                  {results.map((result, idx) => {
                    const item = reviewItems[idx];
                    return (
                      <div
                        key={result.key}
                        className="px-4 py-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                              result.isCorrect
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-primary-800 font-medium truncate">
                              {item?.question.title}
                            </p>
                            <p className="text-xs text-primary-500">
                              {item?.report.mediaName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <TendencyTag
                            tendency={result.selectedTendency}
                            size="sm"
                          />
                          <span className="text-primary-300">→</span>
                          <TendencyTag
                            tendency={result.correctTendency}
                            size="sm"
                          />
                          {result.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant="outline"
                leftIcon={<Home className="w-4 h-4" />}
                onClick={() => navigate("/mistakes")}
              >
                返回错题本
              </Button>
              {results.length > 0 && results.some((r) => !r.isCorrect) && (
                <Button
                  variant="primary"
                  leftIcon={<PlayCircle className="w-4 h-4" />}
                  onClick={handleRestart}
                >
                  重做错题
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentResult = results[currentIndex];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate("/mistakes")}
          >
            返回错题本
          </Button>
          <div className="h-6 w-px bg-primary-200" />
          <div>
            <h2 className="text-lg font-bold text-primary-800">
              按类型重做：
              <span
                className="ml-1"
                style={{ color: type ? CONFUSION_TYPE_COLORS[type] : undefined }}
              >
                {type ? CONFUSION_TYPE_LABELS[type] : ""}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Chip color="primary" variant="default" className="!text-sm !h-8">
            第 <span className="font-mono font-bold mx-1">{currentIndex + 1}</span> /{" "}
            {totalItems} 题
          </Chip>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-mono font-semibold text-emerald-600">
              {correctCount}
            </span>
            <span className="text-primary-300">/</span>
            <span className="text-sm font-mono text-primary-400">
              {results.length}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
          style={{
            width: `${((currentIndex + 1) / totalItems) * 100}%`,
          }}
        />
      </div>

      {currentItem && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Chip color="primary" variant="outline">
                      {currentItem.question.title}
                    </Chip>
                  </div>
                  <CardTitle className="text-base">
                    阅读下列报道，判断其整体媒体倾向
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {currentItem.errorCount > 1 && (
                    <Chip variant="solid" color="accent">
                      <AlertCircle className="w-3 h-3" />
                      错误 {currentItem.errorCount} 次
                    </Chip>
                  )}
                  <Chip variant="outline" color="primary">
                    上次错误选项：
                    {TENDENCY_LABELS[currentItem.previousWrongTendency]}
                  </Chip>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ReportViewer
                report={currentItem.report}
                showAnnotations={submitted}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">选择报道倾向</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioCard
                options={TENDENCY_OPTIONS}
                selected={selectedTendency ?? ""}
                onChange={(v) => {
                  if (!submitted) {
                    setSelectedTendency(v as MediaTendency);
                  }
                }}
                className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              {submitted && currentResult && (
                <div
                  className={cn(
                    "w-full rounded-xl p-4 flex items-start gap-3",
                    currentResult.isCorrect
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-red-50 border border-red-200"
                  )}
                >
                  {currentResult.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={cn(
                        "font-semibold mb-1",
                        currentResult.isCorrect
                          ? "text-emerald-700"
                          : "text-red-700"
                      )}
                    >
                      {currentResult.isCorrect
                        ? "回答正确！已从错题本移除"
                        : "回答错误，继续加油"}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="text-primary-500">你的选择：</span>
                      <TendencyTag
                        tendency={currentResult.selectedTendency}
                        size="sm"
                      />
                      <span className="text-primary-300">→</span>
                      <span className="text-primary-500">正确答案：</span>
                      <TendencyTag
                        tendency={currentResult.correctTendency}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full flex items-center justify-end gap-3">
                {!submitted ? (
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={!selectedTendency}
                    leftIcon={<Check className="w-4 h-4" />}
                    onClick={handleSubmit}
                  >
                    提交答案
                  </Button>
                ) : (
                  <Button
                    variant="accent"
                    size="lg"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={handleNext}
                  >
                    {currentIndex >= totalItems - 1 ? "查看总结" : "下一题"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
