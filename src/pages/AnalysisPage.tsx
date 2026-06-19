import { useMemo, useState } from 'react';
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  List,
  CheckCircle2,
  XCircle,
  BookMarked,
  ListChecks,
  AlertTriangle,
  FileText,
  Target,
  Lightbulb,
} from 'lucide-react';
import {
  getQuestionById,
  questions,
  TENDENCY_COLORS,
  TENDENCY_LABELS,
  CATEGORY_LABELS,
} from '@/data';
import type {
  MediaTendency,
  BasisOption,
  AffectedGroup,
  UserAnswer,
  PracticeQuestion,
  MediaReport,
} from '@/data/types';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import ProgressBar from '@/components/ui/ProgressBar';
import RingScore from '@/components/ui/RingScore';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/Tabs';
import TendencyTag from '@/components/ui/TendencyTag';
import ReportViewer from '@/components/ReportViewer/ReportViewer';
import RadarChart, { RadarDataset } from '@/components/StatsChart/RadarChart';
import { cn } from '@/lib/utils';

interface AnalysisLocationState {
  reportId?: string;
  userAnswer?: UserAnswer;
  score?: number;
  isCorrect?: boolean;
}

const TENDENCY_ORDER: MediaTendency[] = [
  'sympathy',
  'accountability',
  'wait_and_see',
  'sceptical',
  'neutral',
];

const BASIS_LABELS: Record<BasisOption, string> = {
  wording: '措辞',
  source: '消息源',
  angle: '选材角度',
  headline: '标题暗示',
  data: '数据呈现',
};

const GROUP_LABELS: Record<AffectedGroup, string> = {
  government: '政府',
  corporate: '企业',
  public: '公众',
  vulnerable: '弱势群体',
  industry: '行业从业者',
  netizens: '网民',
};

const COLOR_PALETTE = [
  '#4a90d9',
  '#c94a4a',
  '#8e7cc3',
  '#d4a017',
  '#3d8b5c',
  '#e07b39',
  '#1a4a5e',
];

function buildRadarDatasets(reports: MediaReport[]): RadarDataset[] {
  return reports.map((report, idx) => {
    const values = TENDENCY_ORDER.map((tendency) => {
      const count = report.sentenceAnnotations.filter(
        (a) => a.tendencyLabel === tendency
      ).length;
      const total = report.sentenceAnnotations.length || 1;
      return count / total;
    });
    return {
      label: report.mediaName,
      values,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    };
  });
}

function TendencyBadge({
  tendency,
  variant = 'default',
}: {
  tendency: MediaTendency;
  variant?: 'default' | 'wrong' | 'correct';
}) {
  const colors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    default: {
      bg: `${TENDENCY_COLORS[tendency]}14`,
      border: `${TENDENCY_COLORS[tendency]}4D`,
      text: TENDENCY_COLORS[tendency],
      dot: TENDENCY_COLORS[tendency],
    },
    wrong: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#dc2626',
      dot: '#dc2626',
    },
    correct: {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      text: '#16a34a',
      dot: '#16a34a',
    },
  };
  const c = colors[variant];
  return (
    <span
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {TENDENCY_LABELS[tendency]}
    </span>
  );
}

function ComparisonCol({
  title,
  variant,
  tendency,
  basis,
  groups,
  icon,
}: {
  title: string;
  variant: 'user' | 'correct';
  tendency: MediaTendency;
  basis: BasisOption[];
  groups: AffectedGroup[];
  wrong?: boolean;
  icon: React.ReactNode;
}) {
  const isWrong = variant === 'user';
  const strikethrough = isWrong ? 'line-through decoration-red-400 decoration-2 opacity-70' : '';

  return (
    <div
      className={cn(
        'flex-1 rounded-2xl p-5 border',
        variant === 'user'
          ? 'bg-red-50/40 border-red-100'
          : 'bg-green-50/40 border-green-100'
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h5
          className={cn(
            'font-semibold text-sm',
            variant === 'user' ? 'text-red-700' : 'text-green-700'
          )}
        >
          {title}
        </h5>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-primary-500 mb-2">报道倾向</p>
          <div className={strikethrough}>
            <TendencyBadge
              tendency={tendency}
              variant={variant === 'user' ? 'wrong' : 'correct'}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-primary-500 mb-2">判断依据</p>
          <div className="flex flex-wrap gap-1.5">
            {basis.length > 0 ? (
              basis.map((b) => (
                <span
                  key={b}
                  className={cn(
                    'inline-flex items-center h-6 px-2 rounded-md text-xs font-medium',
                    strikethrough,
                    variant === 'user'
                      ? 'bg-red-100/60 text-red-700'
                      : 'bg-green-100/60 text-green-700'
                  )}
                >
                  {BASIS_LABELS[b]}
                </span>
              ))
            ) : (
              <span className="text-xs text-primary-400">未作答</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-primary-500 mb-2">影响人群</p>
          <div className="flex flex-wrap gap-1.5">
            {groups.length > 0 ? (
              groups.map((g) => (
                <span
                  key={g}
                  className={cn(
                    'inline-flex items-center h-6 px-2 rounded-md text-xs font-medium',
                    strikethrough,
                    variant === 'user'
                      ? 'bg-red-100/60 text-red-700'
                      : 'bg-green-100/60 text-green-700'
                  )}
                >
                  {GROUP_LABELS[g]}
                </span>
              ))
            ) : (
              <span className="text-xs text-primary-400">未作答</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as AnalysisLocationState | null;
  const mistakes = useAppStore((s) => s.mistakes);
  const clearMistake = useAppStore((s) => s.clearMistake);

  const question = getQuestionById(id || '');

  const { reportId, userAnswer, score, isCorrect } = state || {};
  const fallbackReportId = question?.reports[0]?.id || '';
  const currentReportId = reportId || fallbackReportId;

  const [selectedReportId, setSelectedReportId] = useState<string>(currentReportId);
  const [addedToMistakes, setAddedToMistakes] = useState(false);

  const radarDatasets = useMemo(() => {
    if (!question) return [];
    return buildRadarDatasets(question.reports);
  }, [question]);

  const currentIndex = useMemo(() => {
    if (!question) return -1;
    return questions.findIndex((q) => q.id === question.id);
  }, [question]);

  const prevQuestion = currentIndex > 0 ? questions[currentIndex - 1] : null;
  const nextQuestion =
    currentIndex >= 0 && currentIndex < questions.length - 1
      ? questions[currentIndex + 1]
      : null;

  const mistakeKey = `${question?.id}_${currentReportId}`;
  const isInMistakes = question ? !!mistakes[mistakeKey] : false;

  const handleAddToMistakes = () => {
    if (!question) return;
    const key = `${question.id}_${currentReportId}`;
    if (isInMistakes) {
      clearMistake(key);
    }
    setAddedToMistakes(true);
  };

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-primary-400 mb-4" />
        <h2 className="text-xl font-semibold text-primary-700 mb-2">
          题目不存在
        </h2>
        <p className="text-primary-500 mb-6">未找到对应的练习案例</p>
        <Button onClick={() => navigate('/practice')} variant="outline">
          <ChevronLeft className="w-4 h-4" />
          返回案例列表
        </Button>
      </div>
    );
  }

  const displayUserAnswer: UserAnswer = userAnswer || {
    questionId: question.id,
    reportId: currentReportId,
    selectedTendency: question.correctTendency,
    selectedBasis: question.correctBasis,
    selectedAffectedGroups: question.correctAffectedGroups,
    isCorrect: true,
    score: 100,
    answeredAt: Date.now(),
  };

  const displayScore = typeof score === 'number' ? score : 100;
  const displayIsCorrect = typeof isCorrect === 'boolean' ? isCorrect : true;

  return (
    <div className="space-y-6 lg:space-y-8">
      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/practice"
          className="text-primary-500 hover:text-primary-700 transition-colors"
        >
          案例练习
        </Link>
        <ChevronRight className="w-4 h-4 text-primary-300" />
        <Link
          to={`/practice/${question.id}`}
          className="text-primary-500 hover:text-primary-700 transition-colors truncate"
        >
          {question.title}
        </Link>
        <ChevronRight className="w-4 h-4 text-primary-300" />
        <span className="text-primary-700 font-medium">答案解析</span>
      </nav>

      <Card
        className={cn(
          'border-2',
          displayIsCorrect
            ? 'border-green-200 bg-gradient-to-br from-green-50/50 via-white to-white'
            : 'border-red-200 bg-gradient-to-br from-red-50/50 via-white to-white'
        )}
      >
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <RingScore score={displayScore} size={140} strokeWidth={12} />
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                {displayIsCorrect ? (
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                ) : (
                  <XCircle className="w-7 h-7 text-red-500" />
                )}
                <h2
                  className={cn(
                    'text-2xl font-bold',
                    displayIsCorrect ? 'text-green-700' : 'text-red-700'
                  )}
                >
                  {displayIsCorrect
                    ? displayScore >= 90
                      ? '完美！分析非常准确'
                      : '回答正确！倾向判断准确'
                    : '需要加强，倾向判断有误'}
                </h2>
              </div>
              <p className="text-primary-600 leading-relaxed max-w-xl">
                {displayIsCorrect
                  ? displayScore >= 90
                    ? '你对该报道的倾向判断及依据分析都非常到位，展现了扎实的媒体素养。继续保持！'
                    : `倾向判断正确，总分 ${displayScore} 分。可以进一步优化判断依据和影响人群的识别，让分析更全面。`
                  : `正确答案是「${TENDENCY_LABELS[question.correctTendency]}」。下方有详细的逐句标注和判定依据拆解，帮助你理解误判原因。`}
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-4">
                <Chip variant="solid" color="primary">
                  {CATEGORY_LABELS[question.category]}
                </Chip>
                <TendencyTag
                  tendency={question.correctTendency}
                  size="md"
                />
                <span className="text-xs text-primary-500">
                  本题共 {question.reports.length} 篇报道
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary-500" />
            答题回顾 vs 正确答案
          </CardTitle>
          <p className="text-sm text-primary-500">
            对比你的作答与正确答案，找出差异
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <ComparisonCol
              title="你的作答"
              variant="user"
              tendency={displayUserAnswer.selectedTendency}
              basis={displayUserAnswer.selectedBasis}
              groups={displayUserAnswer.selectedAffectedGroups}
              icon={
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
              }
            />
            <div className="flex md:hidden items-center justify-center py-1">
              <div className="w-10 h-10 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-primary-500" />
              </div>
            </div>
            <ComparisonCol
              title="正确答案"
              variant="correct"
              tendency={question.correctTendency}
              basis={question.correctBasis}
              groups={question.correctAffectedGroups}
              icon={
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            报道精读（逐句标注）
          </CardTitle>
          <p className="text-sm text-primary-500">
            将鼠标悬停在高亮句子上，查看详细的倾向标注解析
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedReportId} onValueChange={setSelectedReportId}>
            <TabsList className="flex-wrap">
              {question.reports.map((report) => (
                <TabsTrigger
                  key={report.id}
                  value={report.id}
                  className="flex items-center gap-2"
                >
                  <span>{report.mediaName}</span>
                  <TendencyTag tendency={report.overallTendency} size="sm" />
                  {report.id === currentReportId && (
                    <Chip variant="solid" color="accent" className="h-5 px-1.5 text-[10px]">
                      你做过
                    </Chip>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {question.reports.map((report) => (
              <TabsContent key={report.id} value={report.id}>
                <ReportViewer report={report} showAnnotations={true} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            判定依据拆解
          </CardTitle>
          <p className="text-sm text-primary-500">
            为什么正确答案是「{TENDENCY_LABELS[question.correctTendency]}」？
          </p>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {question.reasoning.map((reason, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </span>
                <div className="flex-1 pt-1.5 pb-3 pr-2 border-b border-primary-50 last:border-b-0">
                  <p className="text-sm leading-relaxed text-primary-700">
                    {reason}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {question.commonMistakes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary-500" />
              常见误判对比
            </CardTitle>
            <p className="text-sm text-primary-500">
              了解其他学习者容易出错的选项及原因，避免踩坑
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.commonMistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-primary-100 bg-primary-50/30 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                      <XCircle className="w-4 h-4" />
                      {mistake.wrongOption}
                    </span>
                    <span className="text-xs text-primary-500">
                      误判比例
                    </span>
                  </div>
                  <div className="w-44 shrink-0">
                    <ProgressBar
                      value={mistake.percentage}
                      color="accountability"
                      showLabel
                    />
                  </div>
                </div>
                <div className="space-y-2.5 pl-1">
                  <div className="flex gap-2.5">
                    <span className="text-xs font-semibold text-primary-500 shrink-0 mt-0.5">
                      原因
                    </span>
                    <p className="text-sm text-primary-700 leading-relaxed">
                      {mistake.reason}
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="text-xs font-semibold text-accent-600 shrink-0 mt-0.5">
                      <Lightbulb className="w-3.5 h-3.5 inline mr-0.5" />
                      辨析提示
                    </span>
                    <p className="text-sm text-accent-700 leading-relaxed bg-accent-50/50 rounded-lg p-3 border border-accent-100">
                      {mistake.tip}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {question.reports.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              多媒体横向对比
            </CardTitle>
            <p className="text-sm text-primary-500">
              雷达图展示不同媒体在五种倾向维度上的分布差异
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <RadarChart
              labels={TENDENCY_ORDER.map((t) => TENDENCY_LABELS[t])}
              datasets={radarDatasets}
              size={400}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/practice')}
              leftIcon={<List className="w-4 h-4" />}
            >
              返回列表
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => prevQuestion && navigate(`/practice/${prevQuestion.id}`)}
                disabled={!prevQuestion}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                上一题
              </Button>
              <Button
                variant="ghost"
                onClick={() => nextQuestion && navigate(`/practice/${nextQuestion.id}`)}
                disabled={!nextQuestion}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                下一题
              </Button>
            </div>

            {!displayIsCorrect && !isInMistakes && (
              <Button
                variant="accent"
                onClick={handleAddToMistakes}
                disabled={addedToMistakes}
                leftIcon={
                  <BookMarked className={cn('w-4 h-4', addedToMistakes && 'fill-current')} />
                }
              >
                {addedToMistakes ? '已加入错题本' : '加入错题本'}
              </Button>
            )}
            {!displayIsCorrect && isInMistakes && (
              <Chip variant="solid" color="accent" className="h-9 px-3">
                <BookMarked className="w-4 h-4 fill-current" />
                已在错题本中
              </Chip>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
