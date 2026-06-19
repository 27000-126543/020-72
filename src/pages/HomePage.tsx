import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  BookMarked,
  CheckCircle2,
  Target,
  XCircle,
  Flame,
  Users,
  Building2,
  HeartPulse,
  Globe2,
  PlayCircle,
  Shuffle,
  RefreshCcw,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { questions, CATEGORY_LABELS, type QuestionCategory } from '@/data';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<
  QuestionCategory,
  {
    icon: typeof Users;
    color: string;
    bgGradient: string;
    progressColor: 'primary' | 'accent' | 'sympathy' | 'accountability' | 'wait_and_see' | 'sceptical' | 'neutral';
  }
> = {
  public_event: {
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    bgGradient: 'bg-blue-50',
    progressColor: 'sympathy',
  },
  corporate_crisis: {
    icon: Building2,
    color: 'from-orange-500 to-orange-600',
    bgGradient: 'bg-orange-50',
    progressColor: 'accent',
  },
  social_issue: {
    icon: HeartPulse,
    color: 'from-purple-500 to-purple-600',
    bgGradient: 'bg-purple-50',
    progressColor: 'wait_and_see',
  },
  international: {
    icon: Globe2,
    color: 'from-emerald-500 to-emerald-600',
    bgGradient: 'bg-emerald-50',
    progressColor: 'neutral',
  },
};

function useCountUp(target: number, duration = 1500, start = true) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start) return;
    if (startedRef.current) return;
    startedRef.current = true;

    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, start]);

  return value;
}

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: typeof CheckCircle2;
  color: string;
  delay: number;
}

function StatCard({ label, value, suffix = '', icon: Icon, color, delay }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const displayValue = useCountUp(value, 1600, isVisible);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'opacity-0 translate-y-4 transition-all duration-700 ease-out',
        isVisible && 'opacity-100 translate-y-0'
      )}
    >
      <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-primary-500 mb-1">{label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-primary-800 tabular-nums">
                  {displayValue}
                </span>
                {suffix && (
                  <span className="text-lg font-semibold text-primary-600">
                    {suffix}
                  </span>
                )}
              </div>
            </div>
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-soft',
                color
              )}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CategoryCardProps {
  category: QuestionCategory;
  total: number;
  done: number;
  index: number;
  onClick: () => void;
}

function CategoryCard({ category, total, done, index, onClick }: CategoryCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const config = CATEGORY_CONFIG[category];
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 400 + index * 120);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={cn(
        'opacity-0 translate-y-4 transition-all duration-700 ease-out',
        isVisible && 'opacity-100 translate-y-0'
      )}
    >
      <div
        onClick={onClick}
        className={cn(
          'relative group cursor-pointer rounded-2xl p-6 overflow-hidden',
          'border transition-all duration-300 ease-out',
          'hover:shadow-lg hover:-translate-y-1',
          'bg-white border-primary-100'
        )}
      >
        <div
          className={cn(
            'absolute top-0 right-0 w-40 h-40 -translate-y-1/2 translate-x-1/2 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-40 bg-gradient-to-br',
            config.color
          )}
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-soft',
                config.color
              )}
            >
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold border',
                config.bgGradient,
                'border-transparent',
                `text-${config.color.split('-')[1]}-700`
              )}
            >
              {done}/{total} 题
            </div>
          </div>

          <h3 className="font-serif text-xl font-bold text-primary-800 mb-2 group-hover:text-primary-900 transition-colors">
            {CATEGORY_LABELS[category]}
          </h3>

          <p className="text-sm text-primary-500 mb-5">
            {category === 'public_event' && '自然灾害、事故灾难、公共卫生等突发事件的媒体报道分析'}
            {category === 'corporate_crisis' && '产品安全、品牌危机、商业伦理等企业舆情应对'}
            {category === 'social_issue' && '教育、医疗、养老、教育等社会民生议题讨论'}
            {category === 'international' && '国际关系、国际事件、跨国议题等中外媒体对比分析'}
          </p>

          <ProgressBar
            value={progress}
            color={config.progressColor}
            showLabel
            animated
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-primary-400">
              {progress === 0 ? '开始练习' : progress === 100 ? '已完成' : '继续练习'}
            </span>
            <ArrowRight className="w-4 h-4 text-primary-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { stats, lastQuestionId, mistakes } = useAppStore();

  const accuracy = stats.totalPracticed > 0
    ? Math.round((stats.correctCount / stats.totalPracticed) * 100)
    : 0;

  const mistakeCount = Object.keys(mistakes).length;

  const categoryTotals: Record<QuestionCategory, { total: number; done: number }> = {
    public_event: { total: 0, done: 0 },
    corporate_crisis: { total: 0, done: 0 },
    social_issue: { total: 0, done: 0 },
    international: { total: 0, done: 0 },
  };

  questions.forEach((q) => {
    categoryTotals[q.category].total += 1;
    if (stats.categoryProgress[q.category].done > 0) {
      categoryTotals[q.category].done = stats.categoryProgress[q.category].done;
    }
  });

  const handleRandomPractice = () => {
    if (questions.length === 0) return;
    const randomIndex = Math.floor(Math.random() * questions.length);
    navigate(`/practice/${questions[randomIndex].id}`);
  };

  const handleReviewMistakes = () => {
    navigate('/mistakes');
  };

  const handleContinuePractice = () => {
    if (lastQuestionId) {
      navigate(`/practice/${lastQuestionId}`);
    }
  };

  return (
    <div className="space-y-10 lg:space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 p-8 lg:p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 -translate-x-1/3 -translate-y-1/3 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 translate-x-1/3 translate-y-1/3 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-6">
            <Target className="w-4 h-4" />
            <span>面向新闻传播专业的实训工具</span>
          </div>

          <h1 className="font-serif text-3xl lg:text-5xl font-bold text-white leading-tight mb-4">
            培养舆情分析中的
            <br className="hidden sm:block" />
            <span className="text-accent-200">证据意识</span>
          </h1>

          <p className="text-white/80 text-base lg:text-lg leading-relaxed mb-8 max-w-2xl">
            通过真实案例的报道对比练习，系统训练识别媒体倾向、判断报道立场、
            掌握以证据为基础的舆情分析方法，提升批判性媒介素养。
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="accent"
              leftIcon={<Play className="w-5 h-5" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/practice')}
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              开始练习
            </Button>
            <Button
              size="lg"
              variant="outline"
              leftIcon={<BookMarked className="w-5 h-5" />}
              onClick={() => navigate('/mistakes')}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/40 backdrop-blur-sm"
            >
              查看错题本
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            label="已练习题数"
            value={stats.totalPracticed}
            icon={CheckCircle2}
            color="from-blue-500 to-blue-600"
            delay={100}
          />
          <StatCard
            label="正确率"
            value={accuracy}
            suffix="%"
            icon={Target}
            color="from-emerald-500 to-emerald-600"
            delay={200}
          />
          <StatCard
            label="错题数"
            value={mistakeCount}
            icon={XCircle}
            color="from-rose-500 to-rose-600"
            delay={300}
          />
          <StatCard
            label="连续练习天数"
            value={stats.dailyStreak}
            suffix="天"
            icon={Flame}
            color="from-orange-500 to-orange-600"
            delay={400}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-primary-800 mb-1">
              题组分类
            </h2>
            <p className="text-primary-500 text-sm">
              选择一个分类开始专项练习
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/practice')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            查看全部
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {(Object.keys(CATEGORY_CONFIG) as QuestionCategory[]).map((category, index) => (
            <CategoryCard
              key={category}
              category={category}
              total={categoryTotals[category].total}
              done={categoryTotals[category].done}
              index={index}
              onClick={() => navigate(`/practice?category=${category}`)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-gradient-to-br from-primary-50 via-white to-accent-50/50 border border-primary-100/60 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl lg:text-2xl font-bold text-primary-800 mb-1">
              快捷入口
            </h2>
            <p className="text-primary-500 text-sm">
              快速开始你的练习
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {lastQuestionId && (
            <Button
              size="lg"
              variant="primary"
              leftIcon={<PlayCircle className="w-5 h-5" />}
              onClick={handleContinuePractice}
              className="justify-start h-auto py-4 px-5 flex-col items-start gap-1"
            >
              <span className="font-semibold">继续上次练习</span>
              <span className="text-xs font-normal text-white/80">
                上次练习至题目 {lastQuestionId.toUpperCase()}
              </span>
            </Button>
          )}

          <Button
            size="lg"
            variant={lastQuestionId ? 'outline' : 'primary'}
            leftIcon={<Shuffle className="w-5 h-5" />}
            onClick={handleRandomPractice}
            className={cn(
              'justify-start h-auto py-4 px-5',
              lastQuestionId ? 'flex-col items-start gap-1' : ''
            )}
          >
            <span className="font-semibold">随机练习</span>
            {!lastQuestionId && (
              <span className="text-xs font-normal opacity-80">
                从所有题目中随机抽取
              </span>
            )}
          </Button>

          <Button
            size="lg"
            variant={lastQuestionId ? 'outline' : 'accent'}
            leftIcon={<RefreshCcw className="w-5 h-5" />}
            onClick={handleReviewMistakes}
            className={cn(
              'justify-start h-auto py-4 px-5',
              lastQuestionId ? 'flex-col items-start gap-1' : ''
            )}
          >
            <span className="font-semibold">重做错题</span>
            {!lastQuestionId && (
              <span className="text-xs font-normal opacity-80">
                巩固薄弱知识点
              </span>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
