import { buildDemo } from "./demo";
import { fetchMeta } from "./meta";
import { summarize } from "./metrics";
import { breakEvenRoas, buildRecommendations } from "./rules";
import type { InsightsPayload, Settings } from "./types";

export async function loadInsights(s: Settings): Promise<InsightsPayload> {
  const warnings: string[] = [];
  let source: InsightsPayload["source"] = "demo";
  let data: Awaited<ReturnType<typeof fetchMeta>>;

  const canUseMeta = Boolean(s.metaAccessToken && s.adAccountId);
  if (!s.demoMode && canUseMeta) {
    data = await fetchMeta(s);
    source = "meta";
    if (data.campaigns.length === 0) warnings.push("這個區間沒有任何活動花費。確認帳戶是否有投放中的活動。");
    if (data.campaigns.length > 0 && data.campaigns.every((c) => c.purchases === 0)) {
      warnings.push("所有活動的購買數都是 0。請確認 Pixel / Conversions API 有正確回傳「購買」事件，否則 ROAS 無法計算。");
    }
  } else {
    if (!s.demoMode && !canUseMeta) warnings.push("尚未填入 Meta 存取權杖或廣告帳戶 ID，目前顯示示範資料。");
    data = buildDemo(s.datePreset);
  }

  const summary = summarize(data.campaigns);
  const recommendations = buildRecommendations(data.campaigns, summary, data.daily, s);

  return {
    source,
    fetchedAt: new Date().toISOString(),
    datePreset: s.datePreset,
    currency: s.currency,
    accountName: data.accountName,
    summary,
    campaigns: data.campaigns,
    daily: data.daily,
    recommendations,
    breakEvenRoas: breakEvenRoas(s.grossMargin),
    targetRoas: s.targetRoas,
    warnings,
  };
}
