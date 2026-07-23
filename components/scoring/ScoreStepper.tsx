"use client";

import { Minus, Plus } from "lucide-react";

export function ScoreStepper({
  value,
  onChange,
  min = 1,
  max = 15,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {label && (
        <span className="text-sm font-semibold text-muted">{label}</span>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary shadow-sm disabled:opacity-40"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="h-5 w-5" />
        </button>
        <span className="min-w-10 text-center text-2xl font-black tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label="Increase"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary shadow-sm disabled:opacity-40"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
