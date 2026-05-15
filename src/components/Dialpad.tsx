"use client";

import { Delete } from "lucide-react";

const keys = [
  ["1", ""],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
  ["*", ""],
  ["0", "+"],
  ["#", ""],
];

export default function Dialpad({
  onPress,
  onBackspace,
}: {
  onPress: (digit: string) => void;
  onBackspace: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-3">
      {keys.map(([d, sub]) => (
        <button
          key={d}
          type="button"
          onClick={() => onPress(d)}
          className="aspect-square min-h-[64px] rounded-2xl bg-elevated hover:bg-border active:bg-border/80 active:scale-95 transition-transform flex flex-col items-center justify-center select-none touch-manipulation"
        >
          <span className="text-3xl sm:text-3xl font-medium leading-none">{d}</span>
          {sub && (
            <span className="text-[10px] tracking-widest text-muted mt-1">
              {sub}
            </span>
          )}
        </button>
      ))}
      <div />
      <button
        type="button"
        onClick={onBackspace}
        className="aspect-square min-h-[64px] rounded-2xl bg-elevated hover:bg-border active:scale-95 transition-transform flex items-center justify-center text-muted touch-manipulation"
        aria-label="Backspace"
      >
        <Delete size={24} />
      </button>
      <div />
    </div>
  );
}
