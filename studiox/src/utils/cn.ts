import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const themeColors = ['ink', 'muted', 'cobalt', 'cobalt-deep', 'cobalt-line', 'sky', 'line', 'bone', 'fog', 'paper'] as const;

const isThemeColor = (value: string) => themeColors.some((c) => value === c || value.startsWith(`${c}/`));

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'bg-color': [{ bg: [isThemeColor] }],
      'text-color': [{ text: [isThemeColor] }],
      'border-color': [{ border: [isThemeColor] }],
      'font-family': [{ font: ['geist'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
