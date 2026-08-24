import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumberInputValue(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return ""
  }

  const text = String(value)
  const wholeNumber = text.match(/^(-?\d+)\.0+$/)

  return wholeNumber ? wholeNumber[1] : text
}
