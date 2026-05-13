import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtDuration(sec: number | null | undefined) {
  if (!sec || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function fmtPhone(n: string) {
  const digits = n.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return n;
}

export function toE164(input: string, defaultCountry = "1") {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (input.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  return `+${digits}`;
}
