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
    <div className="grid grid-cols-3 gap-2">
      {keys.map(([d, sub]) => (
        <button
          key={d}
          type="button"
          onClick={() => onPress(d)}
          className="aspect-square rounded-xl bg-elevated hover:bg-border transition-colors flex flex-col items-center justify-center"
        >
          <span className="text-2xl font-medium">{d}</span>
          {sub && <span className="text-[10px] tracking-widest text-muted mt-0.5">{sub}</span>}
        </button>
      ))}
      <div />
      <button
        type="button"
        onClick={onBackspace}
        className="aspect-square rounded-xl bg-elevated hover:bg-border transition-colors flex items-center justify-center text-muted"
      >
        <Delete size={20} />
      </button>
      <div />
    </div>
  );
}
