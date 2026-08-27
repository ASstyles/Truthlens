"use client";

import React from "react";
import { CompetencyDimensionScore } from "@/lib/types";

interface RadarChartProps {
  scores: CompetencyDimensionScore[];
  size?: number;
}

export const RadarChart = React.memo(function RadarChart({ scores, size = 320 }: RadarChartProps) {
  if (!scores || scores.length === 0) return null;

  const center = size / 2;
  const radius = size * 0.38;
  const count = scores.length;
  const angleStep = (Math.PI * 2) / count;

  // Compute background polygon rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius * valueRatio;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate path for the candidate scores polygon
  const scorePoints = React.useMemo(() => {
    return scores
      .map((s, i) => {
        const ratio = Math.max(0.1, Math.min(1.0, s.score / 100));
        const pt = getCoordinates(i, ratio);
        return `${pt.x},${pt.y}`;
      })
      .join(" ");
  }, [scores, size]);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.45)" />
            <stop offset="70%" stopColor="rgba(6, 182, 212, 0.2)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.05)" />
          </radialGradient>
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grid Rings */}
        {rings.map((ringRatio, rIdx) => {
          const ringPoints = Array.from({ length: count }).map((_, i) => {
            const pt = getCoordinates(i, ringRatio);
            return `${pt.x},${pt.y}`;
          }).join(" ");

          return (
            <polygon
              key={`ring-${rIdx}`}
              points={ringPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              strokeDasharray={rIdx === rings.length - 1 ? "none" : "2,2"}
            />
          );
        })}

        {/* Axis Lines */}
        {scores.map((_, i) => {
          const pt = getCoordinates(i, 1.0);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={pt.x}
              y2={pt.y}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={scorePoints}
          fill="url(#radarGradient)"
          stroke="#6366F1"
          strokeWidth="2.5"
          filter="url(#radarGlow)"
          className="transition-all duration-700 ease-out"
        />

        {/* Vertex Points & Labels */}
        {scores.map((s, i) => {
          const ratio = Math.max(0.1, Math.min(1.0, s.score / 100));
          const pt = getCoordinates(i, ratio);
          const labelPt = getCoordinates(i, 1.22);

          return (
            <g key={`vertex-${i}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#06B6D4"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                className="drop-shadow-lg"
              />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-slate-300 text-[11px] font-medium tracking-wide"
              >
                {s.label} ({s.score}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});
