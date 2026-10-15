import { deriveCampaign, withRoas } from "./metrics";
import type { CampaignMetrics, DailyPoint, Settings } from "./types";

const GRAPH = "https://graph.facebook.com/v23.0";

interface ActionEntry { action_type: string; value: string }
interface InsightRow {
  campaign_id?: string;
  campaign_name?: string;
  objective?: string;
  date_start?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
}
interface CampaignRow {
  id: string;
  name: string;
  objective?: string;
  effective_status?: string;
  daily_budget?: string;
}

export class MetaApiError extends Error {
  constructor(message: string, public code?: number, public subcode?: number) {
    super(message);
  }
}

async function graphGet<T>(path: string, token: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as T & { error?: { message: string; code?: number; error_subcode?: number } };
  if (!res.ok || json.error) {
    const e = json.error;
    throw new MetaApiError(e?.message ?? `Meta API ${res.status}`, e?.code, e?.error_subcode);
  }
  return json;
}

async function graphGetAll<T>(path: string, token: string, params: Record<string, string>): Promise<T[]> {
  const out: T[] = [];
  let next: string | undefined;
  let page = await graphGet<{ data: T[]; paging?: { next?: string } }>(path, token, params);
  out.push(...page.data);
  next = page.paging?.next;
  let guard = 0;
  while (next && guard++ < 20) {
    const res = await fetch(next, { cache: "no-store" });
    page = (await res.json()) as { data: T[]; paging?: { next?: string } };
    out.push(...(page.data ?? []));
    next = page.paging?.next;
  }
  return out;
}

function pick(list: ActionEntry[] | undefined, ...types: string[]): number {
  if (!list) return 0;
  for (const t of types) {
    const hit = list.find((a) => a.action_type === t);
    if (hit) return Number(hit.value) || 0;
  }
  return 0;
}

/** 測試權杖與帳戶：回傳帳戶名稱與幣別 */
export async function testConnection(s: Settings): Promise<{ name: string; currency: string; status: number }> {
  const acct = await graphGet<{ name: string; currency: string; account_status: number }>(
    `act_${s.adAccountId}`,
    s.metaAccessToken,
    { fields: "name,currency,account_status" },
  );
  return { name: acct.name, currency: acct.currency, status: acct.account_status };
}

export async function fetchMeta(s: Settings): Promise<{ campaigns: CampaignMetrics[]; daily: DailyPoint[]; accountName: string }> {
  const token = s.metaAccessToken;
  const act = `act_${s.adAccountId}`;
  const insightFields = "campaign_id,campaign_name,objective,spend,impressions,reach,clicks,actions,action_values";

  const [acct, campaignRows, campaignInsights, dailyInsights] = await Promise.all([
    graphGet<{ name: string }>(act, token, { fields: "name" }),
    graphGetAll<CampaignRow>(`${act}/campaigns`, token, {
      fields: "id,name,objective,effective_status,daily_budget",
      limit: "200",
    }),
    graphGetAll<InsightRow>(`${act}/insights`, token, {
      level: "campaign",
      date_preset: s.datePreset,
      fields: insightFields,
      limit: "200",
    }),
    graphGetAll<InsightRow>(`${act}/insights`, token, {
      level: "account",
      date_preset: s.datePreset,
      time_increment: "1",
      fields: "spend,impressions,clicks,actions,action_values",
      limit: "200",
    }),
  ]);

  const meta = new Map(campaignRows.map((c) => [c.id, c]));

  const campaigns = campaignInsights
    .filter((r) => r.campaign_id)
    .map((r) => {
      const m = meta.get(r.campaign_id!);
      return deriveCampaign({
        id: r.campaign_id!,
        name: r.campaign_name ?? m?.name ?? r.campaign_id!,
        objective: m?.objective ?? r.objective ?? "",
        status: m?.effective_status ?? "",
        dailyBudget: m?.daily_budget ? Number(m.daily_budget) / 100 : null,
        spend: Number(r.spend) || 0,
        revenue: pick(r.action_values, "omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"),
        purchases: pick(r.actions, "omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"),
        impressions: Number(r.impressions) || 0,
        reach: Number(r.reach) || 0,
        clicks: Number(r.clicks) || 0,
        linkClicks: pick(r.actions, "link_click"),
        addToCart: pick(r.actions, "omni_add_to_cart", "add_to_cart"),
        initiateCheckout: pick(r.actions, "omni_initiated_checkout", "initiate_checkout"),
        landingPageViews: pick(r.actions, "landing_page_view"),
      });
    })
    .sort((a, b) => b.spend - a.spend);

  const daily = withRoas(
    dailyInsights.map((r) => ({
      date: r.date_start ?? "",
      spend: Number(r.spend) || 0,
      revenue: pick(r.action_values, "omni_purchase", "purchase"),
      purchases: pick(r.actions, "omni_purchase", "purchase"),
      impressions: Number(r.impressions) || 0,
      clicks: Number(r.clicks) || 0,
    })),
  );

  return { campaigns, daily, accountName: acct.name };
}
