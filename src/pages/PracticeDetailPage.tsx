import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Send, AlertCircle } from 'lucide-react';
import {
  getQuestionById,
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
} from '@/data/types';
import { useAppStore } from '@/store/useAppStore';
import { calculateScore, classifyConfusion } from '@/utils/scoring';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/Tabs';
import TendencyTag from '@/components/ui/TendencyTag';
import RadioCard, { RadioCardOption } from '@/components/ui/RadioCard';
import ReportViewer from '@/components/ReportViewer/ReportViewer';
import { cn } from '@/lib/utils';

const TENDENCY_OPTIONS: RadioCardOption<MediaTendency>[] = [
  {
    value: 'sympathy',
    label: '同情倾向',
    description: '侧重受害者遭遇，唤起读者共情',
    icon: <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: TENDENCY_COLORS.sympathy }} />,
  },
  {
    value: 'accountability',
    label: '追责倾向',
    description: '追问责任主体，推动问责',
    icon: <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: TENDENCY_COLORS.accountability }} />,
  },
  {
    value: 'wait_and_see',
    label: '观望态度',
    description: '保持中立，等待事态发展',
    icon: <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: TENDENCY_COLORS.wait_and_see }} />,
  },
  {
    value: 'sceptical',
    label: '引导质疑',
    description: '提出疑问，挑战既有认知',
    icon: <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: TENDENCY_COLORS.sceptical }} />,
  },
  {
    value: 'neutral',
    label: '中立客观',
    description: '平衡报道，不带主观立场',
    icon: <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: TENDENCY_COLORS.neutral }} />,
  },
];

const BASIS_OPTIONS: RadioCardOption<BasisOption>[] = [
  { value: 'wording', label: '措辞', description: '词语的情感色彩和修辞选择' },
  { value: 'source', label: '消息源', description: '引用的来源和立场' },
  { value: 'angle', label: '选材角度', description: '报道选择的素材和视角' },
  { value: 'headline', label: '标题暗示', description: '标题的引导和暗示作用' },
  { value: 'data', label: '数据呈现', description: '数据的选择和呈现方式' },
];

const GROUP_OPTIONS: RadioCardOption<AffectedGroup>[] = [
  { value: 'government', label: '政府', description: '政府部门和公共机构' },
  { value: 'corporate', label: '企业', description: '涉事企业和商业主体' },
  { value: 'public', label: '公众', description: '普通社会公众' },
  { value: 'vulnerable', label: '弱势群体', description: '老人、儿童、受灾群众等' },
  { value: 'industry', label: '行业从业者', description: '相关行业从业人员' },
  { value: 'netizens', label: '网民', description: '网络舆论参与者' },
];

function renderDifficultyStars(difficulty: PracticeQuestion['difficulty']) {
  const stars = [];
  for (let i = 0; i < 3; i++) {
    stars.push(
      <span
        key={i}
        className={cn(
          'w-4 h-4 rounded-full transition-colors',
          i < difficulty ? 'bg-accent-500' : 'bg-primary-200'
        )}
      />
    );
  }
  return <div className="flex items-center gap-1">{stars}</div>;
}

export default function PracticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const submitAnswer = useAppStore((state) => state.submitAnswer);

  const question = getQuestionById(id || '');

  const [selectedReportId, setSelectedReportId] = useState<string>(
    question?.reports[0]?.id || ''
  );
  const [selectedTendency, setSelectedTendency] = useState<MediaTendency | ''>('');
  const [selectedBasis, setSelectedBasis] = useState<BasisOption[]>([]);
  const [selectedAffectedGroups, setSelectedAffectedGroups] = useState<AffectedGroup[]>([]);
  const [tendencyError, setTendencyError] = useState(false);

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-primary-400 mb-4" />
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

  const selectedReport =
    question.reports.find((r) => r.id === selectedReportId) ||
    question.reports[0];

  const handleSubmit = () => {
    if (!selectedTendency) {
      setTendencyError(true);
      return;
    }
    setTendencyError(false);

    const userAnswerInput = {
      selectedTendency,
      selectedBasis,
      selectedAffectedGroups,
    };

    const { score, isCorrect } = calculateScore(userAnswerInput, question);
    const confusionType = classifyConfusion(
      selectedTendency,
      question.correctTendency,
      selectedBasis,
      question
    );

    const answer: UserAnswer = {
      questionId: question.id,
      reportId: selectedReportId,
      selectedTendency,
      selectedBasis,
      selectedAffectedGroups,
      isCorrect,
      score,
      answeredAt: Date.now(),
      confusionType,
    };

    submitAnswer(answer);

    navigate(`/analysis/${question.id}`, {
      state: {
        reportId: selectedReportId,
        userAnswer: answer,
        score,
        isCorrect,
      },
    });
  };

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
        <span className="text-primary-700 font-medium truncate">
          {question.title}
        </span>
      </nav>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl lg:text-2xl mb-3">
                {question.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2.5">
                <Chip variant="solid" color="primary">
                  {CATEGORY_LABELS[question.category]}
                </Chip>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-primary-600">
                    难度
                  </span>
                  {renderDifficultyStars(question.difficulty)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100">
            <p className="text-sm leading-relaxed text-primary-700">
              {question.summary}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-100 text-accent-600 text-sm font-bold">
              2
            </span>
            媒体报道
          </CardTitle>
          <p className="text-sm text-primary-500">
            阅读以下不同媒体对同一事件的报道，选择其中一篇进行分析练习
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
                </TabsTrigger>
              ))}
            </TabsList>
            {question.reports.map((report) => (
              <TabsContent key={report.id} value={report.id}>
                <ReportViewer report={report} showAnnotations={false} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-100 text-accent-600 text-sm font-bold">
              3
            </span>
            答题区
          </CardTitle>
          <p className="text-sm text-primary-500">
            基于阅读的报道，完成以下三道题目
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-primary-800 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-accent-500" />
              a) 报道倾向判断
            </h4>
            <span className={cn(
              'text-xs px-2 py-1 rounded-md font-medium',
              tendencyError
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-primary-50 text-primary-600'
            )}>
              {tendencyError ? '此题为必答题' : '必答 · 单选'}
            </span>
            </div>
            <RadioCard<MediaTendency>
              options={TENDENCY_OPTIONS}
              selected={selectedTendency as MediaTendency}
              onChange={(v) => {
                setSelectedTendency(v as MediaTendency);
                if (tendencyError) setTendencyError(false);
              }}
              className={cn(
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
                tendencyError && 'animate-shake'
              )}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-primary-800 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-accent-500" />
              b) 判断依据（可多选）
            </h4>
            <span className="text-xs px-2 py-1 rounded-md font-medium bg-primary-50 text-primary-600">
              选答 · 多选
            </span>
            </div>
            <RadioCard<BasisOption>
              options={BASIS_OPTIONS}
              selected={selectedBasis}
              onChange={(v) => setSelectedBasis(v as BasisOption[])}
              multiple
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-primary-800 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-accent-500" />
              c) 报道主要影响人群（可多选）
            </h4>
            <span className="text-xs px-2 py-1 rounded-md font-medium bg-primary-50 text-primary-600">
              选答 · 多选
            </span>
            </div>
            <RadioCard<AffectedGroup>
              options={GROUP_OPTIONS}
              selected={selectedAffectedGroups}
              onChange={(v) => setSelectedAffectedGroups(v as AffectedGroup[])}
              multiple
            />
          </div>
        </CardContent>
        <div className="flex justify-center p-6 pt-2 border-t border-primary-50">
          <Button
            variant="accent"
            size="lg"
            onClick={handleSubmit}
            leftIcon={<Send className="w-4 h-4" />}
          >
            提交答案
          </Button>
        </div>
      </Card>
    </div>
  );
}
