import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface LineChartDataItem {
  date: string;
  value: number;
}

interface LineChartProps {
  data: LineChartDataItem[];
  size?: { width: number; height: number };
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  lineColor?: string;
}

export default function LineChart({
  data,
  size = { width: 560, height: 260 },
  className,
  gradientFrom = "#1a4a5e",
  gradientTo = "#e07b39",
  lineColor = "#1a4a5e",
}: LineChartProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const padding = { top: 24, right: 24, bottom: 44, left: 48 };
  const chartW = size.width - padding.left - padding.right;
  const chartH = size.height - padding.top - padding.bottom;

  const { points, pathD, areaD, maxVal, minVal } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], pathD: "", areaD: "", maxVal: 100, minVal: 0 };
    }

    const values = data.map((d) => d.value);
    const rawMax = Math.max(...values, 1);
    const rawMin = Math.min(...values, 0);
    const range = rawMax - rawMin || 1;
    const maxVal = Math.ceil((rawMax + range * 0.15) / 10) * 10;
    const minVal = Math.max(0, Math.floor((rawMin - range * 0.1) / 10) * 10);
    const yRange = maxVal - minVal || 1;

    const pts = data.map((d, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
      const y =
        padding.top + chartH - ((d.value - minVal) / yRange) * chartH;
      return { x, y, value: d.value, date: d.date };
    });

    let path = "";
    pts.forEach((p, i) => {
      if (i === 0) {
        path += `M ${p.x} ${p.y}`;
      } else {
        const prev = pts[i - 1];
        const cpx = (prev.x + p.x) / 2;
        path += ` C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
      }
    });

    let area = path;
    if (pts.length > 0) {
      const lastX = pts[pts.length - 1].x;
      const firstX = pts[0].x;
      const baseY = padding.top + chartH;
      area += ` L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
    }

    return { points: pts, pathD: path, areaD: area, maxVal, minVal };
  }, [data, chartW, chartH, padding.left, padding.top]);

  const yTicks = useMemo(() => {
    const steps = 4;
    const ticks = [];
    const range = maxVal - minVal;
    for (let i = 0; i <= steps; i++) {
      const val = minVal + (range * i) / steps;
      const y = padding.top + chartH - (i / steps) * chartH;
      ticks.push({ value: Math.round(val), y });
    }
    return ticks;
  }, [maxVal, minVal, chartH, padding.top]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        width="100%"
        viewBox={`0 0 ${size.width} ${size.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="line-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientFrom} stopOpacity="0.32" />
            <stop offset="100%" stopColor={gradientTo} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="line-stroke-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
          <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {yTicks.map((tick, i) => (
          <g key={`y-${i}`}>
            <line
              x1={padding.left}
              x2={size.width - padding.right}
              y1={tick.y}
              y2={tick.y}
              stroke="rgba(26,74,94,0.06)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="rgba(26,74,94,0.45)"
              fontFamily="JetBrains Mono, monospace"
            >
              {tick.value}
            </text>
          </g>
        ))}

        <line
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={padding.top + chartH}
          stroke="rgba(26,74,94,0.12)"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          x2={size.width - padding.right}
          y1={padding.top + chartH}
          y2={padding.top + chartH}
          stroke="rgba(26,74,94,0.12)"
          strokeWidth="1"
        />

        {data.length > 1 && (
          <path
            d={areaD}
            fill="url(#line-area-gradient)"
            style={{
              opacity: animated ? 1 : 0,
              transformOrigin: `${padding.left}px ${padding.top + chartH}px`,
              transform: animated ? "scaleY(1)" : "scaleY(0)",
              transition: "all 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.1s",
            }}
          />
        )}

        {data.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="url(#line-stroke-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#line-glow)"
            style={{
              strokeDasharray: animated ? "none" : "2000",
              strokeDashoffset: animated ? "0" : "2000",
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}

        {points.map((p, i) => (
          <g
            key={i}
            style={{
              opacity: animated ? 1 : 0,
              transition: `opacity 0.4s ease ${0.4 + i * 0.04}s`,
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {hoveredIndex === i && (
              <>
                <line
                  x1={p.x}
                  x2={p.x}
                  y1={padding.top}
                  y2={padding.top + chartH}
                  stroke={lineColor}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.3"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="14"
                  fill={lineColor}
                  opacity="0.08"
                />
              </>
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 6 : 4}
              fill="white"
              stroke={lineColor}
              strokeWidth="2.5"
              style={{
                transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            />
          </g>
        ))}

        {points.map(
          (p, i) =>
            (i === 0 ||
              i === points.length - 1 ||
              i % Math.max(1, Math.floor(points.length / 6)) === 0) && (
              <text
                key={`x-${i}`}
                x={p.x}
                y={padding.top + chartH + 22}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(26,74,94,0.55)"
              >
                {formatDate(p.date)}
              </text>
            )
        )}
      </svg>

      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="absolute pointer-events-none animate-fade-in"
          style={{
            left: `${(points[hoveredIndex].x / size.width) * 100}%`,
            top: `${(points[hoveredIndex].y / size.height) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <div className="bg-white border border-primary-100 rounded-xl px-3.5 py-2 shadow-card whitespace-nowrap">
            <div className="text-[10px] uppercase tracking-wider text-primary-400 font-semibold mb-0.5">
              {data[hoveredIndex].date}
            </div>
            <div className="font-mono font-bold text-lg text-primary-800 flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: lineColor }}
              />
              {points[hoveredIndex].value}
              <span className="text-xs text-primary-400 font-normal">%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
