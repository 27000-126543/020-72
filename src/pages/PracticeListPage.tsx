import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Inbox } from 'lucide-react';
import { questions, CATEGORY_LABELS, type QuestionCategory } from '@/data';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import QuestionCard from '@/components/QuestionCard';
import Empty from '@/components/ui/Empty';
import { cn } from '@/lib/utils';

const TAB_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'public_event', label: CATEGORY_LABELS.public_event },
  { value: 'corporate_crisis', label: CATEGORY_LABELS.corporate_crisis },
  { value: 'social_issue', label: CATEGORY_LABELS.social_issue },
  { value: 'international', label: CATEGORY_LABELS.international },
];

export default function PracticeListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { answers } = useAppStore();

  const categoryParam = searchParams.get('category') || 'all';

  const activeTab = useMemo(() => {
    const validValues = TAB_OPTIONS.map((t) => t.value);
    return validValues.includes(categoryParam) ? categoryParam : 'all';
  }, [categoryParam]);

  useEffect(() => {
    const currentCategory = searchParams.get('category');
    if (!currentCategory && activeTab !== 'all') {
      setSearchParams({ category: activeTab });
    }
  }, []);

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: value });
    }
  };

  const filteredQuestions = useMemo(() => {
    if (activeTab === 'all') {
      return questions;
    }
    return questions.filter((q) => q.category === activeTab);
  }, [activeTab]);

  const getQuestionStatus = (questionId: string) => {
    const questionAnswers = answers.filter((a) => a.questionId === questionId);
    if (questionAnswers.length === 0) {
      return { isDone: false, isCorrect: null as boolean | null };
    }
    const allCorrect = questionAnswers.every((a) => a.isCorrect);
    return { isDone: true, isCorrect: allCorrect };
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-2xl lg:text-3xl font-bold text-primary-800">
                  案例练习
                </h1>
                <p className="text-sm text-primary-500">
                  共 {filteredQuestions.length} 道题目
                  {activeTab !== 'all' && ` · ${CATEGORY_LABELS[activeTab as QuestionCategory]}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-primary-500">
              <Filter className="w-4 h-4" />
              <span>分类筛选</span>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-1 -mx-4 px-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="min-w-max">
              {TAB_OPTIONS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  {tab.value === 'all' && (
                    <span
                      className={cn(
                        'ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold',
                        activeTab === tab.value
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-primary-100/60 text-primary-500'
                      )}
                    >
                      {questions.length}
                    </span>
                  )}
                  {tab.value !== 'all' && (
                    <span
                      className={cn(
                        'ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold',
                        activeTab === tab.value
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-primary-100/60 text-primary-500'
                      )}
                    >
                      {questions.filter((q) => q.category === tab.value).length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <Empty
          icon={Inbox}
          title="暂无匹配的题目"
          description={`当前分类"${CATEGORY_LABELS[activeTab as QuestionCategory] || '全部'}"下暂无题目，请尝试选择其他分类。`}
          action={{
            label: '查看全部题目',
            variant: 'primary',
            onClick: () => handleTabChange('all'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredQuestions.map((question, index) => {
            const status = getQuestionStatus(question.id);
            return (
              <div
                key={question.id}
                className={cn(
                  'opacity-0 translate-y-4 animate-fade-in-up',
                )}
                style={{
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                <QuestionCard
                  question={question}
                  isDone={status.isDone}
                  isCorrect={status.isCorrect}
                  onClick={() => navigate(`/practice/${question.id}`)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
