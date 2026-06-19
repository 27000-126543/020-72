import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface PieChartDataItem {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartDataItem[];
  size?: number;
  className?: string;
}

interface SliceData {
  startAngle: number;
  endAngle: number;
  midAngle: number;
  path: string;
  labelX: number;
  labelY: number;
  percentage: number;
  item: PieChartDataItem;
  index: number;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    cx,
    cy,
    "L",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}

export default function PieChart({
  data,
  size = 280,
  className,
}: PieChartProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimated(true));
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const labelRadius = size * 0.3;

  const slices: SliceData[] = [];
  let cumulativeAngle = 0;

  data.forEach((item, index) => {
    const percentage = item.value / total;
    const startAngle = cumulativeAngle * 360;
    const endAngle = (cumulativeAngle + percentage) * 360;
    const midAngle = (startAngle + endAngle) / 2;
    const labelPos = polarToCartesian(cx, cy, labelRadius, midAngle);

    slices.push({
      startAngle,
      endAngle,
      midAngle,
      path: describeArc(cx, cy, radius, startAngle, endAngle),
      labelX: labelPos.x,
      labelY: labelPos.y,
      percentage: percentage * 100,
      item,
      index,
    });

    cumulativeAngle += percentage;
  });

  return (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          <defs>
            {data.map((item, i) => (
              <filter
                key={`shadow-${i}`}
                id={`pie-shadow-${i}`}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="3"
                  floodColor={item.color}
                  floodOpacity="0.25"
                />
              </filter>
            ))}
          </defs>

          <circle
            cx={cx}
            cy={cy}
            r={radius + 4}
            fill="none"
            stroke="rgba(26,74,94,0.06)"
            strokeWidth="1"
          />

          {slices.map((slice) => {
            const isHovered = hoveredIndex === slice.index;
            const scale = isHovered ? 1.04 : 1;
            const offset = isHovered ? 6 : 0;
            const angleRad = ((slice.midAngle - 90) * Math.PI) / 180;
            const tx = Math.cos(angleRad) * offset;
            const ty = Math.sin(angleRad) * offset;

            return (
              <g
                key={slice.index}
                style={{
                  transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <path
                  d={slice.path}
                  fill={slice.item.color}
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  filter={`url(#pie-shadow-${slice.index})`}
                  style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: animated
                      ? "scale(1) rotate(0deg)"
                      : "scale(0) rotate(-30deg)",
                    opacity: animated ? 1 : 0,
                    transition: `all 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${
                      slice.index * 0.08
                    }s`,
                  }}
                />
              </g>
            );
          })}

          <circle
            cx={cx}
            cy={cy}
            r={radius * 0.55}
            fill="white"
            stroke="rgba(26,74,94,0.08)"
          />

          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            className="fill-primary-500"
            fontSize="12"
            fontWeight="500"
          >
            总计
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            className="fill-primary-800"
            fontSize="22"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            {total}
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-sm">
        {slices.map((slice) => (
          <div
            key={slice.index}
            className={cn(
              "flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-all duration-200 cursor-pointer",
              hoveredIndex === slice.index && "bg-primary-50 -translate-y-0.5"
            )}
            onMouseEnter={() => setHoveredIndex(slice.index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0 shadow-soft"
              style={{ backgroundColor: slice.item.color }}
            />
            <span className="text-sm text-primary-700 font-medium flex-1 truncate">
              {slice.item.label}
            </span>
            <span
              className="text-xs font-mono text-primary-600 tabular-nums"
              style={{
                color:
                  hoveredIndex === slice.index
                    ? slice.item.color
                    : undefined,
                fontWeight: hoveredIndex === slice.index ? 700 : 500,
                transition: "all 0.2s",
              }}
            >
              {slice.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
