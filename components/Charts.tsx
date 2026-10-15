"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtDateShort, fmtMoney, fmtRoas } from "@/lib/format";
import type { CampaignMetrics, Currency, DailyPoint } from "@/lib/types";

const axisStyle = { fontSize: 11, fill: "var(--muted)" };
const tooltipStyle = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "var(--text-2)" },
  itemStyle: { color: "var(--text)" },
};

export function RoasTrend({ daily, target, breakEven }: { daily: DailyPoint[]; target: number; breakEven: number }) {
  const data = daily.map((d) => ({ ...d, label: fmtDateShort(d.date) }));
  const max = Math.max(target * 1.3, ...data.map((d) => d.roas));
  return (
    <div className="card p-4">
      <div className="text-sm font-medium">每日 ROAS</div>
      <div className="text-xs text-muted mb-2">實線為當日 ROAS，虛線為目標與損益兩平</div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} axisLine={{ stroke: "var(--axis)" }} tickLine={false} minTickGap={24} />
            <YAxis
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              domain={[0, Math.ceil(max)]}
              width={36}
              tickFormatter={(v: number) => `${v}×`}
            />
            <Tooltip {...tooltipStyle} formatter={(v) => fmtRoas(Number(v))} />
            <ReferenceLine y={target} stroke="var(--good)" strokeDasharray="4 4" label={{ value: `目標 ${target}×`, position: "insideTopRight", fontSize: 11, fill: "var(--good-text)" }} />
            <ReferenceLine y={breakEven} stroke="var(--critical)" strokeDasharray="4 4" label={{ value: `損益兩平 ${breakEven.toFixed(1)}×`, position: "insideBottomRight", fontSize: 11, fill: "var(--critical)" }} />
            <Line type="monotone" dataKey="roas" name="ROAS" stroke="var(--series-1)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SpendRevenue({ daily, currency }: { daily: DailyPoint[]; currency: Currency }) {
  const data = daily.map((d) => ({ ...d, label: fmtDateShort(d.date) }));
  return (
    <div className="card p-4">
      <div className="text-sm font-medium">每日花費與營收</div>
      <div className="text-xs text-muted mb-2">同一金額軸，營收柱高於花費柱代表當日有賺</div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} axisLine={{ stroke: "var(--axis)" }} tickLine={false} minTickGap={24} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => compact(v)} />
            <Tooltip {...tooltipStyle} formatter={(v) => fmtMoney(Number(v), currency)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="spend" name="花費" fill="var(--series-2)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="revenue" name="營收" fill="var(--series-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CampaignRoasBars({
  campaigns,
  target,
  breakEven,
}: {
  campaigns: CampaignMetrics[];
  target: number;
  breakEven: number;
}) {
  const data = campaigns
    .filter((c) => c.spend > 0)
    .map((c) => ({ name: c.name.length > 28 ? c.name.slice(0, 28) + "…" : c.name, full: c.name, roas: Number(c.roas.toFixed(2)) }));
  const h = Math.max(160, data.length * 34 + 40);
  return (
    <div className="card p-4">
      <div className="text-sm font-medium">各活動 ROAS</div>
      <div className="text-xs text-muted mb-2">綠線為目標，紅線為損益兩平；在紅線左邊的活動正在賠錢</div>
      <div style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--grid)" horizontal={false} />
            <XAxis type="number" tick={axisStyle} axisLine={{ stroke: "var(--axis)" }} tickLine={false} tickFormatter={(v: number) => `${v}×`} />
            <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={220} />
            <Tooltip
              {...tooltipStyle}
              formatter={(v) => fmtRoas(Number(v))}
              labelFormatter={(_, p) => (p && p[0] ? (p[0].payload as { full: string }).full : "")}
            />
            <ReferenceLine x={target} stroke="var(--good)" strokeDasharray="4 4" />
            <ReferenceLine x={breakEven} stroke="var(--critical)" strokeDasharray="4 4" />
            <Bar dataKey="roas" name="ROAS" fill="var(--series-1)" radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function compact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}
