import { Check, BookOpen, Star, FileText } from "lucide-react";
import type { PracticeQuestion } from "@/data/types";
import { CATEGORY_LABELS } from "@/data/types";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: PracticeQuestion;
  onClick?: () => void;
  isDone?: boolean;
  isCorrect?: boolean | null;
  className?: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  public_event: {
    bg: "bg-blue-50",
    border: "border-blue-200/60",
    text: "text-blue-700",
    iconBg: "from-blue-500 to-blue-600",
  },
  corporate_crisis: {
    bg: "bg-orange-50",
    border: "border-orange-200/60",
    text: "text-orange-700",
    iconBg: "from-orange-500 to-orange-600",
  },
  social_issue: {
    bg: "bg-purple-50",
    border: "border-purple-200/60",
    text: "text-purple-700",
    iconBg: "from-purple-500 to-purple-600",
  },
  international: {
    bg: "bg-emerald-50",
    border: "border-emerald-200/60",
    text: "text-emerald-700",
    iconBg: "from-emerald-500 to-emerald-600",
  },
};

export default function QuestionCard({
  question,
  onClick,
  isDone = false,
  isCorrect = null,
  className,
}: QuestionCardProps) {
  const style =
    CATEGORY_STYLES[question.category] ?? CATEGORY_STYLES.public_event;

  const difficultyStars = Array.from({ length: 3 }, (_, i) => i < question.difficulty);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-white border rounded-2xl p-5 cursor-pointer overflow-hidden",
        "transition-all duration-300 ease-out card-hover",
        isDone
          ? isCorrect
            ? "border-emerald-200 hover:border-emerald-300"
            : "border-red-200 hover:border-red-300"
          : "border-primary-100 hover:border-primary-200",
        className
      )}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 -translate-y-1/3 translate-x-1/3 rounded-full opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-50",
          isDone
            ? isCorrect
              ? "bg-emerald-300"
              : "bg-red-300"
            : "bg-accent-200"
        )}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-soft flex-shrink-0",
                style.iconBg
              )}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
                  style.bg,
                  style.border,
                  style.text
                )}
              >
                {CATEGORY_LABELS[question.category]}
              </span>
              <div className="flex items-center gap-1 mt-1.5">
                {difficultyStars.map((filled, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
                      filled
                        ? "text-amber-400 fill-amber-400"
                        : "text-primary-200 fill-transparent"
                    )}
                    style={{
                      transform: filled ? "scale(1)" : "scale(0.9)",
                    }}
                  />
                ))}
                <span className="ml-1 text-[11px] text-primary-400 font-medium">
                  {["简单", "中等", "困难"][question.difficulty - 1]}
                </span>
              </div>
            </div>
          </div>

          {isDone && (
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                isCorrect
                  ? "bg-emerald-100 border border-emerald-200"
                  : "bg-red-100 border border-red-200"
              )}
            >
              <Check
                className={cn(
                  "w-4 h-4",
                  isCorrect ? "text-emerald-600" : "text-red-600"
                )}
                style={{
                  transform: isCorrect ? "none" : "rotate(45deg)",
                }}
              />
            </div>
          )}
        </div>

        <h3 className="font-serif text-base font-semibold text-primary-800 leading-snug mb-2 group-hover:text-primary-900 transition-colors line-clamp-2">
          {question.title}
        </h3>

        <p className="text-sm text-primary-500 leading-relaxed line-clamp-2 mb-4">
          {question.summary}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-primary-100/60">
          <div className="flex items-center gap-1.5 text-xs text-primary-500">
            <FileText className="w-3.5 h-3.5 text-primary-400" />
            <span className="font-medium">
              {question.reports.length}
            </span>
            <span className="text-primary-400">篇报道</span>
          </div>

          <div
            className={cn(
              "text-xs font-semibold flex items-center gap-1 transition-all duration-200",
              isDone
                ? isCorrect
                  ? "text-emerald-600"
                  : "text-red-600"
                : "text-accent-600 group-hover:text-accent-700"
            )}
          >
            {isDone ? (isCorrect ? "已完成" : "需重做") : "开始练习"}
            <svg
              className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
