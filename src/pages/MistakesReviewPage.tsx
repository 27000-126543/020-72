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
  Clock,
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppStore, parseMistakeKey } from "@/store/useAppStore";
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
import { questions, getQuestionById } from "@/data";
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
  const location = useLocation();
  const params = useParams<{ type: string }>();
  const type = params.type as ConfusionType | 'spaced';

  const { mistakes, answers, submitAnswer } = useAppStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTendency, setSelectedTendency] = useState<MediaTendency | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const filterParams = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return {
      questionId: sp.get("questionId") || "all",
      media: sp.get("media") || "all",
    };
  }, [location.search]);

  const spacedItems = useMemo<ReviewItem[]>(() => {
    if (type !== "spaced") return [];
    const sp = new URLSearchParams(location.search);
    const items: ReviewItem[] = [];
    for (let i = 0; i < 5; i++) {
      const val = sp.get(`q${i}`);
      if (!val) continue;
      const [questionId, reportId] = val.split('::');
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

      items.push({
        key: `${questionId}::${reportId}`,
        question,
        report,
        previousWrongTendency: latestWrong.selectedTendency,
        errorCount: mistakes[`${questionId}::${reportId}`]?.count || 1,
      });
    }
    return items;
  }, [type, location.search, answers, mistakes]);

  const allFilteredMistakes = useMemo<ReviewItem[]>(() => {
    const items: ReviewItem[] = [];
    for (const [key, record] of Object.entries(mistakes)) {
      const { questionId, reportId } = parseMistakeKey(key);
      const question = getQuestionById(questionId);
      if (!question) continue;
      const report = question.reports.find((r) => r.id === reportId);
      if (!report) continue;

      if (filterParams.questionId !== "all" && filterParams.questionId !== questionId) continue;
      if (filterParams.media !== "all" && filterParams.media !== report.mediaName) continue;

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

      items.push({
        key,
        question,
        report,
        previousWrongTendency: latestWrong.selectedTendency,
        errorCount: record.count,
      });
    }
    return items.sort((a, b) => b.errorCount - a.errorCount);
  }, [mistakes, answers, filterParams]);

  const reviewItems = useMemo<ReviewItem[]>(() => {
    if (!type) return [];
    if (type === "spaced") return spacedItems;
    return allFilteredMistakes.filter((item) => {
      const relatedWrongAnswers = answers.filter(
        (a) =>
          a.questionId === item.question.id &&
          a.reportId === item.report.id &&
          !a.isCorrect
      );
      if (relatedWrongAnswers.length === 0) return false;
      const latestWrong = relatedWrongAnswers.reduce((prev, curr) =>
        curr.answeredAt > prev.answeredAt ? curr : prev
      );
      return latestWrong.confusionType === type;
    });
  }, [type, allFilteredMistakes, spacedItems, answers]);

  const notReviewedItems = useMemo<ReviewItem[]>(() => {
    const reviewedKeys = new Set(reviewItems.map((r) => r.key));
    return allFilteredMistakes.filter((item) => !reviewedKeys.has(item.key));
  }, [allFilteredMistakes, reviewItems]);

  const totalItems = reviewItems.length;
  const currentItem = reviewItems[currentIndex];

  const handleSubmit = () => {
    if (!selectedTendency || !currentItem || submitted) return;

    const { question, report, key } = currentItem;

    const isCorrect = selectedTendency === report.overallTendency;

    const dummyBasis: BasisOption[] = ["wording"];
    const dummyGroups: AffectedGroup[] = ["public"];

    const { score, correctTendency } = calculateScore(
      {
        selectedTendency,
        selectedBasis: dummyBasis,
        selectedAffectedGroups: dummyGroups,
      },
      question,
      report
    );

    const confusionType = classifyConfusion(
      selectedTendency,
      report.overallTendency,
      dummyBasis,
      report
    );

    const newAnswer: UserAnswer = {
      questionId: question.id,
      reportId: report.id,
      correctTendency,
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
    const removedItems = results
      .filter((r) => r.isCorrect)
      .map((r) => ({
        result: r,
        reviewItem: reviewItems.find((ri) => ri.key === r.key),
      }))
      .filter((x) => x.reviewItem);

    const stillWrongItems = results
      .filter((r) => !r.isCorrect)
      .map((r) => ({
        result: r,
        reviewItem: reviewItems.find((ri) => ri.key === r.key),
      }))
      .filter((x) => x.reviewItem);

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
            <CardTitle className="text-2xl">
              {type === "spaced" ? "间隔复习完成" : "本次重做完成"}
            </CardTitle>
            <p className="text-sm text-primary-500 mt-1">
              {type === "spaced"
                ? "基于艾宾浩斯遗忘曲线的科学复习"
                : filterParams.questionId !== "all" || filterParams.media !== "all"
                ? "基于当前筛选范围"
                : CONFUSION_TYPE_LABELS[type as ConfusionType] || ""}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-white shadow-soft border-primary-100">
                <CardContent className="py-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-primary-100 flex items-center justify-center mb-2">
                    <Target className="w-5 h-5 text-primary-600" />
                  </div>
                  <p className="text-xs text-primary-500 mb-1">正确率</p>
                  <p className="text-3xl font-bold text-primary-800 font-mono">
                    {results.length > 0 ? Math.round((removedItems.length / results.length) * 100) : 0}
                    <span className="text-lg">%</span>
                  </p>
                  <p className="text-xs text-primary-400 mt-1">
                    {removedItems.length} / {results.length} 题正确
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
                    {removedItems.length}
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
                    {stillWrongItems.length + notReviewedItems.length}
                  </p>
                  <p className="text-xs text-primary-400 mt-1">
                    继续留在错题本
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="overflow-hidden">
                <CardHeader className="bg-emerald-50/80 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <CardTitle className="text-sm text-emerald-700">
                      已掌握 · 已移除
                    </CardTitle>
                    <Chip color="neutral" variant="solid" className="ml-auto !text-xs !h-6">
                      {removedItems.length}题
                    </Chip>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {removedItems.length === 0 ? (
                    <div className="py-8 text-center text-sm text-primary-400">
                      暂无已掌握的题目
                    </div>
                  ) : (
                    <div className="divide-y divide-primary-50 max-h-72 overflow-y-auto">
                      {removedItems.map(({ result, reviewItem }) => (
                        <div
                          key={result.key}
                          className="px-3 py-2.5 hover:bg-primary-50/60 cursor-pointer transition-colors"
                          onClick={() =>
                            navigate(
                              `/analysis/${reviewItem!.question.id}?reportId=${reviewItem!.report.id}`
                            )
                          }
                        >
                          <p className="text-sm text-primary-800 font-medium line-clamp-1">
                            {reviewItem!.question.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-primary-500">
                              {reviewItem!.report.mediaName}
                            </span>
                            <TendencyTag
                              tendency={result.correctTendency}
                              size="sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="bg-red-50/80 border-b border-red-100">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <CardTitle className="text-sm text-red-700">
                      仍出错 · 待巩固
                    </CardTitle>
                    <Chip color="accountability" variant="solid" className="ml-auto !text-xs !h-6">
                      {stillWrongItems.length}题
                    </Chip>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {stillWrongItems.length === 0 ? (
                    <div className="py-8 text-center text-sm text-primary-400">
                      太棒了，全部答对！
                    </div>
                  ) : (
                    <div className="divide-y divide-primary-50 max-h-72 overflow-y-auto">
                      {stillWrongItems.map(({ result, reviewItem }) => (
                        <div
                          key={result.key}
                          className="px-3 py-2.5 hover:bg-red-50/40 cursor-pointer transition-colors"
                          onClick={() =>
                            navigate(
                              `/analysis/${reviewItem!.question.id}?reportId=${reviewItem!.report.id}`
                            )
                          }
                        >
                          <p className="text-sm text-primary-800 font-medium line-clamp-1">
                            {reviewItem!.question.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-primary-500">
                              {reviewItem!.report.mediaName}
                            </span>
                            <TendencyTag
                              tendency={result.selectedTendency}
                              size="sm"
                              className="border-red-200 bg-red-50"
                            />
                            <span className="text-primary-300 text-xs">→</span>
                            <TendencyTag
                              tendency={result.correctTendency}
                              size="sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="bg-primary-50/80 border-b border-primary-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <CardTitle className="text-sm text-primary-700">
                      还没重做
                    </CardTitle>
                    <Chip color="primary" variant="solid" className="ml-auto !text-xs !h-6">
                      {notReviewedItems.length}题
                    </Chip>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {notReviewedItems.length === 0 ? (
                    <div className="py-8 text-center text-sm text-primary-400">
                      筛选范围内的题都做了
                    </div>
                  ) : (
                    <div className="divide-y divide-primary-50 max-h-72 overflow-y-auto">
                      {notReviewedItems.map((item) => (
                        <div
                          key={item.key}
                          className="px-3 py-2.5 hover:bg-primary-50/60 cursor-pointer transition-colors"
                          onClick={() =>
                            navigate(
                              `/analysis/${item.question.id}?reportId=${item.report.id}`
                            )
                          }
                        >
                          <p className="text-sm text-primary-800 font-medium line-clamp-1">
                            {item.question.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-primary-500">
                              {item.report.mediaName}
                            </span>
                            <span className="text-[11px] text-accent-600">
                              错{item.errorCount}次
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap mt-6">
              <Button
                variant="outline"
                leftIcon={<Home className="w-4 h-4" />}
                onClick={() => navigate("/mistakes")}
              >
                返回错题本
              </Button>
              {stillWrongItems.length > 0 && (
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
              {type === "spaced" ? (
                <>
                  间隔复习
                  <span className="ml-1 text-violet-600">
                    科学复习，记忆更牢
                  </span>
                </>
              ) : (
                <>
                  按类型重做：
                  <span
                    className="ml-1"
                    style={{ color: type ? CONFUSION_TYPE_COLORS[type as ConfusionType] : undefined }}
                  >
                    {type ? CONFUSION_TYPE_LABELS[type as ConfusionType] : ""}
                  </span>
                </>
              )}
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
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      leftIcon={<BookOpen className="w-4 h-4" />}
                      onClick={() => navigate(`/analysis/${currentItem.question.id}?reportId=${currentItem.report.id}`)}
                    >
                      查看解析
                    </Button>
                    <Button
                      variant="accent"
                      size="lg"
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                      onClick={handleNext}
                    >
                      {currentIndex >= totalItems - 1 ? "查看总结" : "下一题"}
                    </Button>
                  </>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
