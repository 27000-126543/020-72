import { useState } from "react";
import { Calendar, Tag, Info, MessageSquare } from "lucide-react";
import type { MediaReport, MediaTendency, SentenceAnnotation } from "@/data/types";
import { TENDENCY_COLORS, TENDENCY_LABELS } from "@/data/types";
import { cn } from "@/lib/utils";

interface ReportViewerProps {
  report: MediaReport;
  showAnnotations: boolean;
}

interface SentenceSegment {
  text: string;
  annotation?: SentenceAnnotation;
}

const TENDENCY_BG_OPACITY: Record<MediaTendency, string> = {
  sympathy: "rgba(74, 144, 217, 0.15)",
  accountability: "rgba(201, 74, 74, 0.15)",
  wait_and_see: "rgba(142, 124, 195, 0.15)",
  sceptical: "rgba(212, 160, 23, 0.15)",
  neutral: "rgba(61, 139, 92, 0.15)",
};

const TENDENCY_BG_HOVER: Record<MediaTendency, string> = {
  sympathy: "rgba(74, 144, 217, 0.28)",
  accountability: "rgba(201, 74, 74, 0.28)",
  wait_and_see: "rgba(142, 124, 195, 0.28)",
  sceptical: "rgba(212, 160, 23, 0.28)",
  neutral: "rgba(61, 139, 92, 0.28)",
};

function splitTextByAnnotations(
  text: string,
  annotations: SentenceAnnotation[]
): SentenceSegment[] {
  if (annotations.length === 0) {
    return [{ text }];
  }

  const sorted = [...annotations].sort(
    (a, b) => a.startIndex - b.startIndex
  );
  const segments: SentenceSegment[] = [];
  let cursor = 0;

  for (const ann of sorted) {
    if (ann.startIndex > cursor) {
      segments.push({
        text: text.slice(cursor, ann.startIndex),
      });
    }
    segments.push({
      text: text.slice(ann.startIndex, ann.endIndex),
      annotation: ann,
    });
    cursor = ann.endIndex;
  }

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
    });
  }

  return segments;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return dateStr;
  }
}

export default function ReportViewer({
  report,
  showAnnotations,
}: ReportViewerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const hoveredAnnotation = report.sentenceAnnotations.find(
    (a) => a.id === hoveredId
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const renderSegments = (text: string) => {
    if (!showAnnotations) return text;

    const segs = splitTextByAnnotations(
      text,
      report.sentenceAnnotations.filter(
        (a) => a.startIndex >= 0 && a.startIndex < text.length
      )
    );

    return segs.map((seg, idx) => {
      if (!seg.annotation) {
        return <span key={idx}>{seg.text}</span>;
      }

      const ann = seg.annotation;
      const tendency = ann.tendencyLabel;
      const isHovered = hoveredId === ann.id;

      return (
        <span
          key={`${ann.id}-${idx}`}
          className={cn(
            "sentence-highlight relative inline",
            tendency && "rounded-sm"
          )}
          style={{
            backgroundColor: tendency
              ? isHovered
                ? TENDENCY_BG_HOVER[tendency]
                : TENDENCY_BG_OPACITY[tendency]
              : undefined,
            boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
          }}
          onMouseEnter={(e) => {
            setHoveredId(ann.id);
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const parent = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();
            setTooltipPos({
              x: rect.left - parent.left + rect.width / 2,
              y: rect.top - parent.top - 8,
            });
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredId(null)}
        >
          {seg.text}
        </span>
      );
    });
  };

  return (
    <div className="relative bg-paper-100 border border-paper-300/60 rounded-2xl shadow-soft overflow-hidden bg-grain">
      <div className="relative border-b border-paper-300/60 bg-gradient-to-r from-white/80 to-paper-50/80 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center border border-primary-200/60">
              <span className="font-serif text-lg font-bold text-primary-700">
                {report.mediaName.slice(0, 2)}
              </span>
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-primary-800">
                {report.mediaName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-primary-500 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(report.publishDate)}</span>
              </div>
            </div>
          </div>

          {showAnnotations && (
            <div
              className="chip"
              style={{
                borderColor: TENDENCY_COLORS[report.overallTendency] + "50",
                backgroundColor: TENDENCY_COLORS[report.overallTendency] + "18",
                color: TENDENCY_COLORS[report.overallTendency],
              }}
            >
              <Tag className="w-3 h-3" />
              整体倾向：{TENDENCY_LABELS[report.overallTendency]}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 lg:p-8" onMouseMove={handleMouseMove}>
        <article className="newspaper max-w-none">
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-primary-900 leading-tight mb-5 text-balance">
            {report.headline}
          </h2>

          <p className="font-serif italic text-lg text-primary-700 leading-relaxed mb-6 pb-6 border-b border-paper-300/50">
            {renderSegments(report.lead)}
          </p>

          <div className="space-y-5">
            {report.keyParagraphs.map((para, idx) => (
              <p
                key={idx}
                className="relative pl-4 border-l-2 border-accent-300/40 font-serif text-primary-800 leading-loose text-[15.5px]"
              >
                {renderSegments(para)}
              </p>
            ))}
          </div>

          {report.fullText && report.keyParagraphs.length > 0 && (
            <details className="mt-8">
              <summary className="cursor-pointer text-sm text-primary-500 hover:text-primary-700 font-medium transition-colors">
                展开阅读全文
              </summary>
              <div className="mt-4 pt-4 border-t border-paper-300/50 font-serif text-primary-700 leading-loose space-y-4">
                <p>{renderSegments(report.fullText)}</p>
              </div>
            </details>
          )}
        </article>
      </div>

      {hoveredAnnotation && (
        <div
          className="absolute z-50 pointer-events-none animate-fade-in"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div
            className="relative w-72 md:w-80 rounded-xl shadow-lift border border-primary-100 bg-white/98 backdrop-blur-sm p-4"
          >
            {hoveredAnnotation.tendencyLabel && (
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor:
                      TENDENCY_COLORS[hoveredAnnotation.tendencyLabel] +
                      "20",
                    color: TENDENCY_COLORS[hoveredAnnotation.tendencyLabel],
                  }}
                >
                  <MessageSquare className="w-3 h-3" />
                  {TENDENCY_LABELS[hoveredAnnotation.tendencyLabel]}
                </span>
              </div>
            )}

            <div className="flex items-start gap-2 mb-2.5">
              <Info className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-primary-700 leading-relaxed">
                {hoveredAnnotation.annotation}
              </p>
            </div>

            {hoveredAnnotation.keywords.length > 0 && (
              <div className="border-t border-primary-100/70 pt-2.5">
                <p className="text-[10px] uppercase tracking-wider text-primary-400 font-semibold mb-1.5">
                  关键词
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hoveredAnnotation.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent-50 text-accent-700 text-[11px] font-medium border border-accent-200/60"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div
              className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-3 bg-white/98 border-b border-r border-primary-100 rotate-45 -mt-1.5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
