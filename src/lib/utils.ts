import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function rp(value: number): string {
  return rupiah.format(Math.round(value));
}

/** Compact rupiah for charts: 12,5rb / 1,2jt */
export function rpShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}rb`;
  return String(Math.round(value));
}

export function fmtDate(ts: number): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ts));
}

export function fmtTime(ts: number): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function fmtDateTime(ts: number): string {
  return `${fmtDate(ts)}, ${fmtTime(ts)}`;
}

export function fmtDay(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateStr}T00:00:00+07:00`));
}

export function paymentLabel(method: string): string {
  switch (method) {
    case "cash":
      return "Tunai";
    case "qris":
      return "QRIS";
    case "card":
      return "Kartu";
    case "transfer":
      return "Transfer";
    case "ewallet":
      return "E-Wallet";
    default:
      return method;
  }
}
