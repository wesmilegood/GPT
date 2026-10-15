import { deriveCampaign, daysFor, withRoas } from "./metrics";
import type { CampaignMetrics, DailyPoint } from "./types";

/** 固定種子的偽隨機，讓示範資料每次一致 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

interface DemoSpec {
  id: string;
  name: string;
  objective: string;
  status: string;
  dailyBudget: number | null;
  /** 目標 ROAS 水準、CTR 水準、頻率水準，用來產生有代表性的情境 */
  roas: number;
  ctr: number;
  frequency: number;
  cpm: number;
  aov: number;
  spendPerDay: number;
}

const SPECS: DemoSpec[] = [
  { id: "d1", name: "ASC 常態銷售｜全品項（Advantage+）", objective: "OUTCOME_SALES", status: "ACTIVE", dailyBudget: 3000, roas: 6.8, ctr: 1.9, frequency: 1.6, cpm: 180, aov: 1450, spendPerDay: 2950 },
  { id: "d2", name: "再行銷｜7 天加入購物車未結帳", objective: "OUTCOME_SALES", status: "ACTIVE", dailyBudget: 800, roas: 9.4, ctr: 2.6, frequency: 4.3, cpm: 320, aov: 1620, spendPerDay: 790 },
  { id: "d3", name: "拓新｜興趣受眾：育兒 × 戶外", objective: "OUTCOME_SALES", status: "ACTIVE", dailyBudget: 2000, roas: 2.1, ctr: 0.7, frequency: 1.3, cpm: 210, aov: 1380, spendPerDay: 1980 },
  { id: "d4", name: "目錄廣告｜momo 商品組（DPA）", objective: "PRODUCT_CATALOG_SALES", status: "ACTIVE", dailyBudget: 1500, roas: 4.4, ctr: 1.4, frequency: 2.1, cpm: 160, aov: 1290, spendPerDay: 1480 },
  { id: "d5", name: "KOL 素材測試｜Tammy 開箱影片", objective: "OUTCOME_SALES", status: "ACTIVE", dailyBudget: 600, roas: 3.2, ctr: 1.1, frequency: 1.2, cpm: 240, aov: 1500, spendPerDay: 420 },
  { id: "d6", name: "流量｜部落格文章導流", objective: "OUTCOME_TRAFFIC", status: "ACTIVE", dailyBudget: 300, roas: 0.6, ctr: 2.9, frequency: 1.5, cpm: 95, aov: 1200, spendPerDay: 290 },
  { id: "d7", name: "互動｜貼文加溫", objective: "OUTCOME_ENGAGEMENT", status: "PAUSED", dailyBudget: 200, roas: 0, ctr: 3.5, frequency: 1.1, cpm: 60, aov: 0, spendPerDay: 0 },
];

export function buildDemo(datePreset: string): { campaigns: CampaignMetrics[]; daily: DailyPoint[]; accountName: string } {
  const days = daysFor(datePreset);
  const rand = rng(42 + days);
  const today = new Date();
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const dailyAgg = dates.map((date) => ({ date, spend: 0, revenue: 0, purchases: 0, impressions: 0, clicks: 0 }));

  const campaigns = SPECS.map((s) => {
    let spend = 0, revenue = 0, purchases = 0, impressions = 0, clicks = 0;
    dates.forEach((_, idx) => {
      if (s.spendPerDay === 0) return;
      // 週末略高、加上雜訊；拓新活動後期 ROAS 衰退，模擬素材疲乏
      const dow = new Date(dates[idx]).getDay();
      const weekend = dow === 0 || dow === 6 ? 1.12 : 1;
      const noise = 0.8 + rand() * 0.4;
      const decay = s.id === "d3" ? 1 - (idx / days) * 0.35 : 1;
      const daySpend = s.spendPerDay * weekend * (0.9 + rand() * 0.2);
      const dayImpr = (daySpend / s.cpm) * 1000;
      const dayClicks = dayImpr * (s.ctr / 100) * noise;
      const dayRev = daySpend * s.roas * noise * decay;
      const dayPurch = s.aov > 0 ? Math.round(dayRev / s.aov) : 0;
      spend += daySpend; revenue += dayRev; purchases += dayPurch; impressions += dayImpr; clicks += dayClicks;
      const a = dailyAgg[idx];
      a.spend += daySpend; a.revenue += dayRev; a.purchases += dayPurch; a.impressions += dayImpr; a.clicks += dayClicks;
    });
    const reach = impressions / s.frequency;
    const linkClicks = clicks * 0.78;
    const lpv = linkClicks * 0.72;
    const atc = purchases * 3.1;
    const ic = purchases * 1.6;
    return deriveCampaign({
      id: s.id,
      name: s.name,
      objective: s.objective,
      status: s.status,
      dailyBudget: s.dailyBudget,
      spend: Math.round(spend),
      revenue: Math.round(revenue),
      purchases,
      impressions: Math.round(impressions),
      reach: Math.round(reach),
      clicks: Math.round(clicks),
      linkClicks: Math.round(linkClicks),
      addToCart: Math.round(atc),
      initiateCheckout: Math.round(ic),
      landingPageViews: Math.round(lpv),
    });
  });

  const daily = withRoas(
    dailyAgg.map((d) => ({
      ...d,
      spend: Math.round(d.spend),
      revenue: Math.round(d.revenue),
      impressions: Math.round(d.impressions),
      clicks: Math.round(d.clicks),
    })),
  );

  return { campaigns, daily, accountName: "示範帳戶（Demo）" };
}
