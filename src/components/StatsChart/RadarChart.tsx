import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface RadarDataset {
  label: string;
  values: number[];
  color: string;
}

interface RadarChartProps {
  labels: string[];
  datasets: RadarDataset[];
  size?: number;
  className?: string;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export default function RadarChart({
  labels,
  datasets,
  size = 360,
  className,
}: RadarChartProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredDataset, setHoveredDataset] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const labelRadius = size * 0.44;
  const axisCount = Math.max(labels.length, 3);
  const angleStep = 360 / axisCount;

  const levels = 4;

  const gridLines = useMemo(() => {
    const lines: Array<{ r: number; points: string }> = [];
    for (let i = 1; i <= levels; i++) {
      const r = (radius * i) / levels;
      const pts = labels
        .map((_, idx) => {
          const pos = polarToCartesian(cx, cy, r, idx * angleStep);
          return `${pos.x},${pos.y}`;
        })
        .join(" ");
      lines.push({ r, points: pts });
    }
    return lines;
  }, [labels, cx, cy, radius, angleStep, levels]);

  const axisLines = useMemo(() => {
    return labels.map((_, idx) => {
      const pos = polarToCartesian(cx, cy, radius, idx * angleStep);
      return {
        x1: cx,
        y1: cy,
        x2: pos.x,
        y2: pos.y,
      };
    });
  }, [labels, cx, cy, radius, angleStep]);

  const labelPositions = useMemo(() => {
    return labels.map((label, idx) => {
      const pos = polarToCartesian(cx, cy, labelRadius, idx * angleStep);
      const angle = ((idx * angleStep - 90) * Math.PI) / 180;
      let anchor: "start" | "middle" | "end" = "middle";
      const cos = Math.cos(angle);
      if (cos > 0.15) anchor = "start";
      else if (cos < -0.15) anchor = "end";
      return { ...pos, label, anchor };
    });
  }, [labels, cx, cy, labelRadius, angleStep]);

  const datasetShapes = useMemo(() => {
    return datasets.map((ds, dsIdx) => {
      const normalizedValues = ds.values.map((v) => Math.max(0, Math.min(1, v)));
      const points = normalizedValues
        .map((val, idx) => {
          const r = radius * val;
          const pos = polarToCartesian(cx, cy, r, idx * angleStep);
          return `${pos.x},${pos.y}`;
        })
        .join(" ");

      const pointPositions = normalizedValues.map((val, idx) => {
        const r = radius * val;
        return polarToCartesian(cx, cy, r, idx * angleStep);
      });

      return {
        ...ds,
        index: dsIdx,
        points,
        pointPositions,
        normalizedValues,
      };
    });
  }, [datasets, cx, cy, radius, angleStep]);

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
            {datasets.map((ds, i) => (
              <radialGradient
                key={`grad-${i}`}
                id={`radar-fill-${i}`}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop offset="0%" stopColor={ds.color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={ds.color} stopOpacity="0.08" />
              </radialGradient>
            ))}
          </defs>

          <circle
            cx={cx}
            cy={cy}
            r={radius + 8}
            fill="none"
            stroke="rgba(26,74,94,0.05)"
            strokeWidth="1"
          />

          {gridLines.map((line, i) => (
            <polygon
              key={`grid-${i}`}
              points={line.points}
              fill="none"
              stroke="rgba(26,74,94,0.08)"
              strokeWidth="1"
              strokeDasharray={i === levels - 1 ? "none" : "3 3"}
              style={{
                opacity: animated ? 1 : 0,
                transform: `scale(${animated ? 1 : 0.6})`,
                transformOrigin: `${cx}px ${cy}px`,
                transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 0.05}s`,
              }}
            />
          ))}

          {axisLines.map((line, i) => (
            <line
              key={`axis-${i}`}
              {...line}
              stroke="rgba(26,74,94,0.1)"
              strokeWidth="1"
              style={{
                opacity: animated ? 1 : 0,
                transition: `opacity 0.4s ease ${0.2 + i * 0.03}s`,
              }}
            />
          ))}

          {labelPositions.map((pos, i) => (
            <g
              key={`label-${i}`}
              style={{
                opacity: animated ? 1 : 0,
                transform: animated ? "translateY(0)" : "translateY(4px)",
                transition: `all 0.4s ease ${0.35 + i * 0.04}s`,
              }}
            >
              <text
                x={pos.x}
                y={pos.y}
                textAnchor={pos.anchor}
                dominantBaseline="middle"
                fontSize="12.5"
                fontWeight="600"
                fill="rgba(13,36,46,0.78)"
              >
                {pos.label}
              </text>
            </g>
          ))}

          {datasetShapes.map((ds, idx) => {
            const isHovered = hoveredDataset === idx;
            const isFaded = hoveredDataset !== null && !isHovered;

            return (
              <g
                key={`ds-${idx}`}
                style={{
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHoveredDataset(idx)}
                onMouseLeave={() => setHoveredDataset(null)}
              >
                <polygon
                  points={ds.points}
                  fill={`url(#radar-fill-${idx})`}
                  stroke={ds.color}
                  strokeWidth={isHovered ? 2.5 : 1.8}
                  strokeLinejoin="round"
                  style={{
                    opacity: animated ? (isFaded ? 0.25 : 1) : 0,
                    transform: `scale(${animated ? (isHovered ? 1.02 : 1) : 0})`,
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: `all 0.7s cubic-bezier(0.4,0,0.2,1) ${
                      0.3 + idx * 0.12
                    }s`,
                  }}
                />

                {ds.pointPositions.map((p, pi) => (
                  <circle
                    key={`pt-${pi}`}
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 5 : 3.5}
                    fill="white"
                    stroke={ds.color}
                    strokeWidth="2.2"
                    style={{
                      opacity: animated ? (isFaded ? 0.3 : 1) : 0,
                      transition: `all 0.3s cubic-bezier(0.34,1.56,0.64,1) ${
                        0.6 + idx * 0.12 + pi * 0.03
                      }s`,
                    }}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {datasetShapes.map((ds, idx) => {
          const isHovered = hoveredDataset === idx;
          return (
            <div
              key={`legend-${idx}`}
              className={cn(
                "flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer transition-all duration-200",
                isHovered && "bg-primary-50 -translate-y-0.5 shadow-soft"
              )}
              onMouseEnter={() => setHoveredDataset(idx)}
              onMouseLeave={() => setHoveredDataset(null)}
            >
              <span
                className="w-3 h-3 rounded-sm shadow-soft"
                style={{ backgroundColor: ds.color }}
              />
              <span
                className="text-sm font-medium"
                style={{
                  color: isHovered ? ds.color : "rgba(13,36,46,0.75)",
                  transition: "color 0.2s",
                }}
              >
                {ds.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
