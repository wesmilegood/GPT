"use client";

import { useMemo, useState } from "react";
import { fmtMoney, fmtNum, fmtPct, fmtRoas } from "@/lib/format";
import { objectiveLabel } from "@/lib/rules";
import type { CampaignMetrics, Currency } from "@/lib/types";

type Key = keyof Pick<CampaignMetrics, "spend" | "revenue" | "roas" | "purchases" | "cpa" | "ctr" | "cpm" | "frequency">;

const COLS: { key: Key; label: string; fmt: (v: number, c: Currency) => string }[] = [
  { key: "spend", label: "花費", fmt: (v, c) => fmtMoney(v, c) },
  { key: "revenue", label: "營收", fmt: (v, c) => fmtMoney(v, c) },
  { key: "roas", label: "ROAS", fmt: (v) => fmtRoas(v) },
  { key: "purchases", label: "購買", fmt: (v) => fmtNum(v) },
  { key: "cpa", label: "CPA", fmt: (v, c) => fmtMoney(v, c) },
  { key: "ctr", label: "CTR", fmt: (v) => fmtPct(v) },
  { key: "cpm", label: "CPM", fmt: (v, c) => fmtMoney(v, c) },
  { key: "frequency", label: "頻率", fmt: (v) => fmtNum(v, 2) },
];

export function CampaignTable({
  campaigns,
  currency,
  target,
  breakEven,
}: {
  campaigns: CampaignMetrics[];
  currency: Currency;
  target: number;
  breakEven: number;
}) {
  const [sort, setSort] = useState<{ key: Key; dir: "asc" | "desc" }>({ key: "spend", dir: "desc" });
  const rows = useMemo(() => {
    const r = [...campaigns];
    r.sort((a, b) => (sort.dir === "desc" ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key]));
    return r;
  }, [campaigns, sort]);

  const toggle = (key: Key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted">
          <tr className="border-b border-border">
            <th className="text-left font-medium px-4 py-2.5">活動</th>
            <th className="text-left font-medium px-2 py-2.5">目標</th>
            <th className="text-left font-medium px-2 py-2.5">狀態</th>
            {COLS.map((c) => (
              <th key={c.key} className="text-right font-medium px-2 py-2.5 whitespace-nowrap">
                <button onClick={() => toggle(c.key)} className="hover:text-text">
                  {c.label}
                  {sort.key === c.key ? (sort.dir === "desc" ? " ▾" : " ▴") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const tone =
              c.spend === 0 ? "text-muted" : c.roas >= target ? "text-good-text" : c.roas < breakEven ? "text-critical" : "text-serious";
            return (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                <td className="px-4 py-2.5 max-w-[34ch]">
                  <div className="truncate" title={c.name}>
                    {c.name}
                  </div>
                  {c.dailyBudget != null && (
                    <div className="text-xs text-muted">日預算 {fmtMoney(c.dailyBudget, currency)}</div>
                  )}
                </td>
                <td className="px-2 py-2.5 whitespace-nowrap text-text-2">{objectiveLabel(c.objective)}</td>
                <td className="px-2 py-2.5 whitespace-nowrap">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                      c.status === "ACTIVE" ? "bg-good/15 text-good-text" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {c.status === "ACTIVE" ? "投放中" : c.status === "PAUSED" ? "已暫停" : c.status}
                  </span>
                </td>
                {COLS.map((col) => (
                  <td
                    key={col.key}
                    className={`text-right px-2 py-2.5 tabular whitespace-nowrap ${col.key === "roas" ? `font-semibold ${tone}` : ""}`}
                  >
                    {c.spend === 0 && col.key !== "spend" ? "—" : col.fmt(c[col.key], currency)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
