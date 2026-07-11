import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeFormatDate(date: string | null | undefined, fmt: string, fallback = ""): string {
  if (!date) return fallback;
  const d = parseISO(date);
  return isValid(d) ? format(d, fmt) : fallback || date;
}
