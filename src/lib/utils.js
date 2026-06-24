import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function convertToAmPm(time24h) {
  const [hours, minutes] = time24h.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${minutes} ${ampm}`;
}