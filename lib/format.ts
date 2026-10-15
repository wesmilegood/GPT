import type { Currency } from "./types";

const locale = "zh-TW";

export function fmtMoney(v: number, currency: Currency = "TWD", digits = 0): string {
  if (!Number.isFinite(v)) return "—";
  if (currency === "TWD") {
    return `NT$${new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v)}`;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v);
}

export function fmtNum(v: number, digits = 0): string {
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(v);
}

export function fmtPct(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return "—";
  return `${v.toFixed(digits)}%`;
}

export function fmtRoas(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return `${v.toFixed(2)}×`;
}

export function fmtDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}
