export type Currency = "TWD" | "USD" | "HKD" | "JPY" | "SGD" | "MYR";

export interface Settings {
  /** Meta Marketing API 長期存取權杖（伺服器端保存） */
  metaAccessToken: string;
  /** 廣告帳戶 ID，純數字，不含 act_ 前綴 */
  adAccountId: string;
  currency: Currency;
  /** 目標 ROAS（例如 5） */
  targetRoas: number;
  /** 毛利率 0–1，用來算損益兩平 ROAS = 1 / 毛利率 */
  grossMargin: number;
  /** 判斷一個活動好壞前至少要花掉多少錢（避免小樣本誤判） */
  minSpendToJudge: number;
  /** 頻率超過此值視為受眾疲乏 */
  maxFrequency: number;
  /** CTR（全部）低於此 % 視為素材吸引力不足 */
  minCtr: number;
  /** CPM 高於此值提醒受眾過窄或競價過熱 */
  maxCpm: number;
  /** 加碼時的單次幅度 % */
  scaleStepPct: number;
  /** 分析的日期區間 */
  datePreset: "last_7d" | "last_14d" | "last_30d" | "last_90d";
  /** 是否使用示範資料 */
  demoMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  metaAccessToken: "",
  adAccountId: "",
  currency: "TWD",
  targetRoas: 5,
  grossMargin: 0.5,
  minSpendToJudge: 3000,
  maxFrequency: 3,
  minCtr: 1.0,
  maxCpm: 250,
  scaleStepPct: 20,
  datePreset: "last_30d",
  demoMode: true,
};

export type Objective =
  | "OUTCOME_SALES"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_AWARENESS"
  | "OUTCOME_LEADS"
  | "CONVERSIONS"
  | "LINK_CLICKS"
  | "POST_ENGAGEMENT"
  | "PRODUCT_CATALOG_SALES"
  | string;

export interface CampaignMetrics {
  id: string;
  name: string;
  objective: Objective;
  status: "ACTIVE" | "PAUSED" | "WITH_ISSUES" | string;
  dailyBudget: number | null;
  spend: number;
  revenue: number;
  purchases: number;
  impressions: number;
  reach: number;
  clicks: number;
  linkClicks: number;
  addToCart: number;
  initiateCheckout: number;
  landingPageViews: number;
  /** 衍生指標 */
  roas: number;
  ctr: number; // %
  cpm: number;
  cpc: number;
  frequency: number;
  cpa: number;
  aov: number;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  spend: number;
  revenue: number;
  purchases: number;
  impressions: number;
  clicks: number;
  roas: number;
}

export interface AccountSummary {
  spend: number;
  revenue: number;
  purchases: number;
  impressions: number;
  clicks: number;
  reach: number;
  roas: number;
  ctr: number;
  cpm: number;
  cpa: number;
  aov: number;
  frequency: number;
}

export type Severity = "critical" | "warning" | "good" | "info";

export interface Recommendation {
  id: string;
  severity: Severity;
  /** 哪個活動（帳戶層級為 null） */
  campaignId: string | null;
  campaignName: string | null;
  title: string;
  why: string;
  action: string;
  /** 實際可執行的設定變更，給使用者直接照做 */
  steps: string[];
  metric?: { label: string; value: string; target?: string };
}

export interface InsightsPayload {
  source: "demo" | "meta";
  fetchedAt: string;
  datePreset: Settings["datePreset"];
  currency: Currency;
  accountName: string;
  summary: AccountSummary;
  campaigns: CampaignMetrics[];
  daily: DailyPoint[];
  recommendations: Recommendation[];
  breakEvenRoas: number;
  targetRoas: number;
  warnings: string[];
}
