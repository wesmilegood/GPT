import type { AccountSummary, CampaignMetrics, DailyPoint } from "./types";

export function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

export function deriveCampaign(
  base: Omit<CampaignMetrics, "roas" | "ctr" | "cpm" | "cpc" | "frequency" | "cpa" | "aov">,
): CampaignMetrics {
  return {
    ...base,
    roas: safeDiv(base.revenue, base.spend),
    ctr: safeDiv(base.clicks, base.impressions) * 100,
    cpm: safeDiv(base.spend, base.impressions) * 1000,
    cpc: safeDiv(base.spend, base.clicks),
    frequency: safeDiv(base.impressions, base.reach),
    cpa: safeDiv(base.spend, base.purchases),
    aov: safeDiv(base.revenue, base.purchases),
  };
}

export function summarize(campaigns: CampaignMetrics[]): AccountSummary {
  const t = campaigns.reduce(
    (acc, c) => {
      acc.spend += c.spend;
      acc.revenue += c.revenue;
      acc.purchases += c.purchases;
      acc.impressions += c.impressions;
      acc.clicks += c.clicks;
      acc.reach += c.reach;
      return acc;
    },
    { spend: 0, revenue: 0, purchases: 0, impressions: 0, clicks: 0, reach: 0 },
  );
  return {
    ...t,
    roas: safeDiv(t.revenue, t.spend),
    ctr: safeDiv(t.clicks, t.impressions) * 100,
    cpm: safeDiv(t.spend, t.impressions) * 1000,
    cpa: safeDiv(t.spend, t.purchases),
    aov: safeDiv(t.revenue, t.purchases),
    frequency: safeDiv(t.impressions, t.reach),
  };
}

export function withRoas(points: Omit<DailyPoint, "roas">[]): DailyPoint[] {
  return points.map((p) => ({ ...p, roas: safeDiv(p.revenue, p.spend) }));
}

export function daysFor(preset: string): number {
  switch (preset) {
    case "last_7d":
      return 7;
    case "last_14d":
      return 14;
    case "last_90d":
      return 90;
    default:
      return 30;
  }
}
