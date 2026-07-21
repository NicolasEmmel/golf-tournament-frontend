import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatApiError(message: string, status?: number): string {
  if (status) {
    return `${message} (HTTP ${status})`;
  }
  return message;
}
