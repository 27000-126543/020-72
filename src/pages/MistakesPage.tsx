import { useState, useMemo } from "react";
import {
  BookMarked,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Trash2,
  PlayCircle,
  AlertCircle,
  BookOpen,
  CalendarX,
  XCircle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import TendencyTag from "@/components/ui/TendencyTag";
import Empty from "@/components/ui/Empty";
import PieChart, { PieChartDataItem } from "@/components/StatsChart/PieChart";
import LineChart, { LineChartDataItem } from "@/components/StatsChart/LineChart";
import type { ConfusionType, MediaTendency, UserAnswer } from "@/data/types";
import { questions, getQuestionById } from "@/data";
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

const CONFUSION_TYPE_TIPS: Record<ConfusionType, string> = {
  fact_as_negative: "注意区分纯事实描述与带有情感倾向的负面表述，关注报道是否在客观陈述事实。",
  ignore_source: "答题前先分析媒体定位：官方媒体/都市类/调查类/评论类的立场天然不同。",
  wording_sensitivity: "重点标注带有情感色彩的词汇：如形容词、比喻、反问句等，它们是倾向判断的关键。",
  neutral_vs_wait: "中立客观报道会提供多方观点、大量数据；观望报道则会强调不确定性，使用\"有待观察\"等表述。",
  sympathy_vs_sceptical: "同情报道聚焦受害者遭遇和困境；质疑报道追问责任主体和制度缺陷，注意区分\"关心人\"和\"追问事\"。",
};

const ALL_CONFUSION_TYPES: ConfusionType[] = [
  "fact_as_negative",
  "ignore_source",
  "wording_sensitivity",
  "neutral_vs_wait",
  "sympathy_vs_sceptical",
];

interface MistakeItemWithDetail {
  key: string;
  questionId: string;
  reportId: string;
  count: number;
  lastWrong: number;
  confusionType: ConfusionType;
  selectedTendency: MediaTendency;
  correctTendency: MediaTendency;
  questionTitle: string;
  mediaName: string;
}

function formatTimestamp(ts: number): string {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days}天前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "";
  }
}

export default function MistakesPage() {
  const navigate = useNavigate();
  const { mistakes, stats, answers, clearMistake, resetAll } = useAppStore();
  const [expandedTypes, setExpandedTypes] = useState<Set<ConfusionType>>(new Set());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [filterQuestionId, setFilterQuestionId] = useState<string>("all");
  const [filterMedia, setFilterMedia] = useState<string>("all");

  const allMediaNames = useMemo(() => {
    const names = new Set<string>();
    for (const q of questions) {
      for (const r of q.reports) {
        names.add(r.mediaName);
      }
    }
    return Array.from(names).sort();
  }, []);

  const filteredQuestions = useMemo(() => {
    if (filterMedia === "all") return questions;
    return questions.filter((q) => q.reports.some((r) => r.mediaName === filterMedia));
  }, [filterMedia]);

  const mistakeItems = useMemo(() => {
    const items: MistakeItemWithDetail[] = [];
    for (const [key, record] of Object.entries(mistakes)) {
      const [questionId, reportId] = key.split("_");
      const question = getQuestionById(questionId);
      if (!question) continue;
      const report = question.reports.find((r) => r.id === reportId);
      if (!report) continue;

      if (filterQuestionId !== "all" && filterQuestionId !== questionId) continue;
      if (filterMedia !== "all" && filterMedia !== report.mediaName) continue;

      const relatedAnswers = answers.filter(
        (a) => a.questionId === questionId && a.reportId === reportId && !a.isCorrect
      );
      const latestAnswer: UserAnswer | undefined = relatedAnswers.length > 0
        ? relatedAnswers.reduce((prev, curr) =>
            curr.answeredAt > prev.answeredAt ? curr : prev
          )
        : undefined;

      const confusionType: ConfusionType =
        latestAnswer?.confusionType ?? "fact_as_negative";

      items.push({
        key,
        questionId,
        reportId,
        count: record.count,
        lastWrong: record.lastWrong,
        confusionType,
        selectedTendency: latestAnswer?.selectedTendency ?? "neutral",
        correctTendency: report.overallTendency,
        questionTitle: question.title,
        mediaName: report.mediaName,
      });
    }
    return items.sort((a, b) => b.lastWrong - a.lastWrong);
  }, [mistakes, answers, filterQuestionId, filterMedia]);

  const totalMistakes = mistakeItems.length;

  const maxConfusionType = useMemo(() => {
    if (totalMistakes === 0) return null;
    const counts = ALL_CONFUSION_TYPES.map((t) => ({
      type: t,
      count: stats.confusionDistribution[t] ?? 0,
    }));
    const max = counts.reduce((prev, curr) =>
      curr.count > prev.count ? curr : prev
    );
    return max.count > 0 ? max : null;
  }, [stats.confusionDistribution, totalMistakes]);

  const redoSuggestion = useMemo(() => {
    const highFreq = mistakeItems.filter((m) => m.count >= 2);
    if (highFreq.length === 0) return totalMistakes;
    return highFreq.length;
  }, [mistakeItems, totalMistakes]);

  const pieData: PieChartDataItem[] = useMemo(() => {
    return ALL_CONFUSION_TYPES.map((t) => ({
      label: CONFUSION_TYPE_LABELS[t],
      value: stats.confusionDistribution[t] ?? 0,
      color: CONFUSION_TYPE_COLORS[t],
    })).filter((d) => d.value > 0);
  }, [stats.confusionDistribution]);

  const lineData: LineChartDataItem[] = useMemo(() => {
    const history = stats.history.slice(-14);
    return history.map((h) => ({
      date: h.date,
      value: h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0,
    }));
  }, [stats.history]);

  const mistakesByType = useMemo(() => {
    const grouped: Record<ConfusionType, MistakeItemWithDetail[]> = {
      fact_as_negative: [],
      ignore_source: [],
      wording_sensitivity: [],
      neutral_vs_wait: [],
      sympathy_vs_sceptical: [],
    };
    for (const item of mistakeItems) {
      grouped[item.confusionType].push(item);
    }
    return grouped;
  }, [mistakeItems]);

  const toggleType = (type: ConfusionType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleRemoveMistake = (key: string) => {
    clearMistake(key);
  };

  const handleClearMastered = () => {
    const masteredKeys = mistakeItems
      .filter((m) => m.count === 1)
      .map((m) => m.key);
    masteredKeys.forEach(clearMistake);
  };

  const handleResetAll = () => {
    resetAll();
    setShowResetConfirm(false);
  };

  const handleBatchReview = (type: ConfusionType) => {
    const params = new URLSearchParams();
    if (filterQuestionId !== "all") params.set("questionId", filterQuestionId);
    if (filterMedia !== "all") params.set("media", filterMedia);
    const queryStr = params.toString();
    navigate(`/mistakes/review/${type}${queryStr ? `?${queryStr}` : ""}`);
  };

  const handleSingleReview = (questionId: string, reportId: string) => {
    navigate(`/practice/${questionId}?reportId=${reportId}`);
  };

  if (totalMistakes === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-800">错题本</h2>
            <p className="text-sm text-primary-500">记录你的薄弱点，针对性强化训练</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-10">
            <Empty
              icon={BookOpen}
              title="暂无错题"
              description="做得不错！继续保持。你可以去案例练习区完成更多题目，错题会自动记录在这里。"
              action={{
                label: "去练习",
                icon: <PlayCircle className="w-4 h-4" />,
                onClick: () => navigate("/practice"),
                variant: "primary",
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-800">错题本</h2>
            <p className="text-sm text-primary-500">记录你的薄弱点，针对性强化训练</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-white">
          <CardContent className="py-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-primary-500 mb-1">总错题数</p>
                <p className="text-3xl font-bold text-primary-800 font-mono">
                  {totalMistakes}
                </p>
                <p className="text-xs text-primary-400 mt-1">
                  条待巩固的错题记录
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent-50 to-white">
          <CardContent className="py-6">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-sm text-primary-500 mb-1">最常见混淆类型</p>
                {maxConfusionType ? (
                  <>
                    <p
                      className="text-lg font-bold truncate"
                      style={{ color: CONFUSION_TYPE_COLORS[maxConfusionType.type] }}
                    >
                      {CONFUSION_TYPE_LABELS[maxConfusionType.type]}
                    </p>
                    <p className="text-xs text-primary-400 mt-1">
                      累计 <span className="font-mono font-semibold">{maxConfusionType.count}</span> 次出错
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-bold text-primary-400">暂无数据</p>
                )}
              </div>
              <div className="w-11 h-11 rounded-xl bg-accent-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-accent-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="py-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-primary-500 mb-1">需重做建议</p>
                <p className="text-3xl font-bold text-emerald-600 font-mono">
                  {redoSuggestion}
                </p>
                <p className="text-xs text-primary-400 mt-1">
                  {redoSuggestion !== totalMistakes
                    ? "道高频错题需重点巩固"
                    : "道错题建议全部重做"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>混淆类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <PieChart data={pieData} />
            ) : (
              <div className="py-12 text-center text-primary-400 text-sm">
                暂无分布数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>正确率趋势（最近{lineData.length}天）</CardTitle>
          </CardHeader>
          <CardContent>
            {lineData.length > 1 ? (
              <LineChart data={lineData} />
            ) : (
              <div className="py-12 text-center text-primary-400 text-sm flex flex-col items-center gap-2">
                <CalendarX className="w-10 h-10 text-primary-200" />
                <p>需要至少2天的练习记录才能生成趋势图</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-500" />
              <CardTitle className="text-base">筛选错题</CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterQuestionId}
                onChange={(e) => setFilterQuestionId(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg border border-primary-200 bg-white text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="all">全部题组</option>
                {filteredQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
              <select
                value={filterMedia}
                onChange={(e) => setFilterMedia(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg border border-primary-200 bg-white text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="all">全部媒体</option>
                {allMediaNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {(filterQuestionId !== "all" || filterMedia !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterQuestionId("all");
                    setFilterMedia("all");
                  }}
                >
                  清除筛选
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {totalMistakes > 0 && (filterQuestionId !== "all" || filterMedia !== "all") && (
          <CardContent className="pt-0">
            <p className="text-sm text-primary-500">
              当前筛选条件下共有 <span className="font-semibold text-primary-700">{totalMistakes}</span> 道错题
            </p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>错题分类整理</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleClearMastered}
              >
                清空已掌握
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={() => setShowResetConfirm(true)}
              >
                重置全部
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {ALL_CONFUSION_TYPES.map((type) => {
            const typeMistakes = mistakesByType[type];
            const isExpanded = expandedTypes.has(type);
            const color = CONFUSION_TYPE_COLORS[type];

            return (
              <div
                key={type}
                className={cn(
                  "rounded-xl border transition-all duration-200 overflow-hidden",
                  isExpanded
                    ? "border-primary-200 bg-primary-50/40"
                    : "border-primary-100 bg-white hover:border-primary-200 hover:bg-primary-50/20"
                )}
              >
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => toggleType(type)}
                >
                  <button
                    className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-primary-500 hover:bg-primary-100 transition-colors"
                    aria-label={isExpanded ? "折叠" : "展开"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <h4 className="font-semibold text-sm text-primary-800 truncate">
                      {CONFUSION_TYPE_LABELS[type]}
                    </h4>
                  </div>

                  <Chip color="primary" variant="solid">
                    {typeMistakes.length} 题
                  </Chip>

                  {typeMistakes.length > 0 && (
                    <Button
                      variant="accent"
                      size="sm"
                      leftIcon={<PlayCircle className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBatchReview(type);
                      }}
                    >
                      批量重做
                    </Button>
                  )}
                </div>

                {typeMistakes.length > 0 && (
                  <div className="px-4 pb-3">
                    <div
                      className="rounded-lg p-3 mb-3 text-xs flex items-start gap-2"
                      style={{
                        backgroundColor: `${color}12`,
                        color: color,
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{CONFUSION_TYPE_TIPS[type]}</p>
                    </div>
                  </div>
                )}

                {isExpanded && typeMistakes.length > 0 && (
                  <div className="px-4 pb-4 space-y-3">
                    {typeMistakes.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-xl border border-primary-100 bg-white p-4 shadow-soft"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="min-w-0 flex-1">
                            <h5 className="font-medium text-sm text-primary-800 mb-1 line-clamp-2">
                              {item.questionTitle}
                            </h5>
                            <p className="text-xs text-primary-500 flex items-center gap-1.5">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-primary-100 text-primary-600">
                                {item.mediaName}
                              </span>
                              <span className="flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                错误{item.count}次
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarX className="w-3 h-3" />
                                {formatTimestamp(item.lastWrong)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="text-xs text-primary-400 shrink-0">
                            你的选择：
                          </span>
                          <TendencyTag
                            tendency={item.selectedTendency}
                            size="sm"
                            className="border-red-200 bg-red-50/50"
                          />
                          <span className="text-xs text-primary-300">→</span>
                          <span className="text-xs text-primary-400 shrink-0">
                            正确答案：
                          </span>
                          <TendencyTag
                            tendency={item.correctTendency}
                            size="sm"
                            className="border-emerald-200 bg-emerald-50/50"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleRemoveMistake(item.key)}
                          >
                            移除错题
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<PlayCircle className="w-4 h-4" />}
                            onClick={() => handleSingleReview(item.questionId, item.reportId)}
                          >
                            单题重做
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && typeMistakes.length === 0 && (
                  <div className="px-4 pb-4">
                    <div className="rounded-xl border border-dashed border-primary-200 py-6 text-center">
                      <p className="text-sm text-primary-400">
                        该类型暂无错题，继续保持！
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-md w-full mx-4 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-accent-500" />
                确认重置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary-600 mb-4">
                此操作将清除所有答题记录、统计数据和错题本，且不可恢复。确定要重置吗？
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowResetConfirm(false)}
                >
                  取消
                </Button>
                <Button
                  variant="accent"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={handleResetAll}
                >
                  确认重置
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
