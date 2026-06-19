import { useMemo, useState } from 'react';
import {
  useNavigate,
  Link,
} from 'react-router-dom';
import {
  TrendingUp,
  BookOpen,
  Target,
  Clock,
  PlayCircle,
  BookMarked,
  ChevronRight,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore, parseMistakeKey } from '@/store/useAppStore';
import { questions } from '@/data';
import type { MediaTendency, UserAnswer } from '@/data/types';
import { TENDENCY_COLORS, TENDENCY_LABELS } from '@/data/types';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import TendencyTag from '@/components/ui/TendencyTag';
import ProgressBar from '@/components/ui/ProgressBar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import PieChart, { PieChartDataItem } from '@/components/StatsChart/PieChart';
import { cn } from '@/lib/utils';

interface QuestionProgress {
  questionId: string;
  title: string;
  category: string;
  totalReports: number;
  practicedReports: number;
  correctReports: number;
  accuracy: number;
  lastPracticedAt: number;
  mostWrongTendency: MediaTendency | null;
  wrongCount: number;
}

interface MediaProgress {
  mediaName: string;
  questionId: string;
  reportId: string;
  practiced: boolean;
  correct: boolean;
  lastPracticedAt: number;
  selectedTendency: MediaTendency | null;
  correctTendency: MediaTendency | null;
}

function formatDate(ts: number): string {
  if (!ts) return '未练习';
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function getMostFrequentTendency(tendencies: MediaTendency[]): MediaTendency | null {
  if (tendencies.length === 0) return null;
  const counts = new Map<MediaTendency, number>();
  for (const t of tendencies) {
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  let max = 0;
  let result: MediaTendency | null = null;
  for (const [t, c] of counts) {
    if (c > max) {
      max = c;
      result = t;
    }
  }
  return result;
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const { answers, mistakes } = useAppStore();
  const [viewMode, setViewMode] = useState<'question' | 'media'>('question');

  const questionProgress = useMemo<QuestionProgress[]>(() => {
    return questions.map((q) => {
      const reportAnswers = q.reports.map((report) => {
        const reportAnswersList = answers.filter(
          (a) => a.questionId === q.id && a.reportId === report.id
        );
        return reportAnswersList.length > 0
          ? reportAnswersList.reduce((prev, curr) =>
              curr.answeredAt > prev.answeredAt ? curr : prev
            )
          : null;
      });

      const practiced = reportAnswers.filter(Boolean) as UserAnswer[];
      const correct = practiced.filter((a) => a.isCorrect);
      const wrong = practiced.filter((a) => !a.isCorrect);

      const wrongTendencies = wrong.map((a) => a.selectedTendency);

      const lastPracticed = practiced.length > 0
        ? Math.max(...practiced.map((a) => a.answeredAt))
        : 0;

      return {
        questionId: q.id,
        title: q.title,
        category: q.category,
        totalReports: q.reports.length,
        practicedReports: practiced.length,
        correctReports: correct.length,
        accuracy: practiced.length > 0
          ? Math.round((correct.length / practiced.length) * 100)
          : 0,
        lastPracticedAt: lastPracticed,
        mostWrongTendency: getMostFrequentTendency(wrongTendencies),
        wrongCount: wrong.length,
      };
    }).sort((a, b) => b.lastPracticedAt - a.lastPracticedAt);
  }, [answers]);

  const mediaProgress = useMemo<MediaProgress[]>(() => {
    const result: MediaProgress[] = [];
    for (const q of questions) {
      for (const r of q.reports) {
        const reportAnswersList = answers.filter(
          (a) => a.questionId === q.id && a.reportId === r.id
        );
        const latest = reportAnswersList.length > 0
          ? reportAnswersList.reduce((prev, curr) =>
              curr.answeredAt > prev.answeredAt ? curr : prev
            )
          : null;
        result.push({
          mediaName: r.mediaName,
          questionId: q.id,
          reportId: r.id,
          practiced: !!latest,
          correct: latest?.isCorrect ?? false,
          lastPracticedAt: latest?.answeredAt || 0,
          selectedTendency: latest?.selectedTendency ?? null,
          correctTendency: r.overallTendency,
        });
      }
    }
    return result.sort((a, b) => b.lastPracticedAt - a.lastPracticedAt);
  }, [answers]);

  const totalPracticed = questionProgress.reduce((sum, p) => sum + p.practicedReports, 0);
  const totalCorrect = questionProgress.reduce((sum, p) => sum + p.correctReports, 0);
  const overallAccuracy = totalPracticed > 0 ? Math.round((totalCorrect / totalPracticed) * 100) : 0;

  const tendencyStats = useMemo<PieChartDataItem[]>(() => {
    const allWrong = answers.filter((a) => !a.isCorrect);
    const counts = new Map<MediaTendency, number>();
    for (const a of allWrong) {
      counts.set(a.selectedTendency, (counts.get(a.selectedTendency) || 0) + 1);
    }
    return (Object.keys(TENDENCY_COLORS) as MediaTendency[]).map((t) => ({
      label: TENDENCY_LABELS[t],
      value: counts.get(t) || 0,
      color: TENDENCY_COLORS[t],
    })).filter((d) => d.value > 0);
  }, [answers]);

  const mistakeKeys = Object.keys(mistakes);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary-900 mb-1">
            学习进度
          </h1>
          <p className="text-primary-500 text-sm">
            各题组、各媒体的正确率和薄弱点分析
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-primary-100/60">
            <button
              onClick={() => setViewMode('question')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === 'question'
                  ? "bg-white text-primary-700 shadow-soft"
                  : "text-primary-500 hover:text-primary-700"
              )}
            >
              按题组
            </button>
            <button
              onClick={() => setViewMode('media')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === 'media'
                  ? "bg-white text-primary-700 shadow-soft"
                  : "text-primary-500 hover:text-primary-700"
              )}
            >
              按媒体
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-primary-500">已练习报道</p>
                <p className="text-2xl font-bold text-primary-800">{totalPracticed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-primary-500">总正确率</p>
                <p className="text-2xl font-bold text-primary-800">{overallAccuracy}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-white">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-primary-500">待巩固错题</p>
                <p className="text-2xl font-bold text-primary-800">{mistakeKeys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-primary-500">最近练习</p>
                <p className="text-sm font-bold text-primary-800 mt-1">
                  {formatDate(Math.max(...questionProgress.map(p => p.lastPracticedAt)))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {tendencyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="w-4 h-4 text-primary-500" />
              错判倾向分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-48 h-48 shrink-0">
                <PieChart data={tendencyStats} size={192} />
              </div>
              <div className="flex flex-wrap gap-2">
                {tendencyStats.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-primary-700">
                      {item.label}
                    </span>
                    <span className="text-sm text-primary-500">{item.value}次</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'question' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-primary-500" />
              题组进度
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-primary-50">
              {questionProgress.map((p) => (
                <div
                  key={p.questionId}
                  className="px-5 py-4 hover:bg-primary-50/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-primary-800 truncate">
                          {p.title}
                        </h3>
                        <Chip variant="outline" className="!text-xs !h-6">
                          {p.practicedReports}/{p.totalReports}篇
                        </Chip>
                        {p.wrongCount > 0 && p.mostWrongTendency && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-primary-400">常错:</span>
                            <TendencyTag tendency={p.mostWrongTendency} size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-primary-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(p.lastPracticedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          正确率 {p.accuracy}%
                        </span>
                      </div>
                      <div className="mt-3 max-w-md">
                        <ProgressBar
                          value={p.accuracy}
                          showLabel
                          color={p.accuracy >= 70 ? 'neutral' : p.accuracy >= 40 ? 'sceptical' : 'accountability'}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.wrongCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<BookMarked className="w-4 h-4" />}
                          onClick={() => navigate(`/mistakes?questionId=${p.questionId}`)}
                        >
                          错题复盘
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<PlayCircle className="w-4 h-4" />}
                        onClick={() => navigate(`/practice/${p.questionId}`)}
                      >
                        去练习
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-primary-500" />
              媒体进度
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-primary-50 max-h-[600px] overflow-y-auto">
              {mediaProgress.map((m, idx) => (
                <div
                  key={`${m.questionId}-${m.reportId}-${idx}`}
                  className="px-5 py-3 hover:bg-primary-50/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      {m.practiced ? (
                        m.correct ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                        )
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-primary-200 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h4 className="font-medium text-primary-800 text-sm truncate">
                          {m.mediaName}
                        </h4>
                        <p className="text-xs text-primary-500 truncate">
                          {questions.find(q => q.id === m.questionId)?.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {m.practiced && m.selectedTendency && (
                        <div className="flex items-center gap-1">
                          <TendencyTag tendency={m.selectedTendency} size="sm" />
                          {!m.correct && m.correctTendency && (
                            <>
                              <span className="text-primary-300 text-xs">→</span>
                              <TendencyTag tendency={m.correctTendency} size="sm" />
                            </>
                          )}
                        </div>
                      )}
                      <span className="text-xs text-primary-400 whitespace-nowrap">
                        {formatDate(m.lastPracticedAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                        onClick={() => navigate(`/practice/${m.questionId}?reportId=${m.reportId}`)}
                      >
                        {m.practiced ? '重做' : '练习'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {mistakeKeys.length > 0 && (
        <Card className="bg-gradient-to-br from-rose-50/40 via-white to-white border-rose-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              立即巩固
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-primary-600">
                你有 <span className="font-bold text-rose-600">{mistakeKeys.length}</span> 道错题等待巩固
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  leftIcon={<BookMarked className="w-4 h-4" />}
                  onClick={() => navigate('/mistakes')}
                >
                  查看错题本
                </Button>
                <Button
                  variant="accent"
                  leftIcon={<PlayCircle className="w-4 h-4" />}
                  onClick={() => navigate('/mistakes/review/fact_as_negative')}
                >
                  立即重做
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
