import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_SETTINGS, type Settings } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "settings.json");

/**
 * 設定存在 data/settings.json（已加入 .gitignore）。
 * 環境變數 META_ACCESS_TOKEN / META_AD_ACCOUNT_ID 會在檔案沒填時當作後備。
 */
/** 檔案系統唯讀時（例如 Vercel）改存在記憶體，實例重啟後會消失 */
let memoryStore: Partial<Settings> | null = null;

export const isReadOnlyStore = Boolean(process.env.VERCEL);

export async function readSettings(): Promise<Settings> {
  let fromFile: Partial<Settings> = {};
  if (memoryStore) {
    fromFile = memoryStore;
  } else {
    try {
      const raw = await fs.readFile(FILE, "utf8");
      fromFile = JSON.parse(raw) as Partial<Settings>;
    } catch {
      // 檔案不存在就用預設
    }
  }
  const merged: Settings = { ...DEFAULT_SETTINGS, ...fromFile };
  if (!merged.metaAccessToken && process.env.META_ACCESS_TOKEN) {
    merged.metaAccessToken = process.env.META_ACCESS_TOKEN;
  }
  if (!merged.adAccountId && process.env.META_AD_ACCOUNT_ID) {
    merged.adAccountId = process.env.META_AD_ACCOUNT_ID.replace(/^act_/, "");
  }
  return merged;
}

export async function writeSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await readSettings();
  const next: Settings = { ...current, ...sanitize(patch) };
  if (isReadOnlyStore) {
    memoryStore = next;
    return next;
  }
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  } catch {
    memoryStore = next;
  }
  return next;
}

function sanitize(patch: Partial<Settings>): Partial<Settings> {
  const out: Partial<Settings> = {};
  if (typeof patch.metaAccessToken === "string") out.metaAccessToken = patch.metaAccessToken.trim();
  if (typeof patch.adAccountId === "string") out.adAccountId = patch.adAccountId.trim().replace(/^act_/, "");
  if (typeof patch.currency === "string") out.currency = patch.currency as Settings["currency"];
  if (typeof patch.datePreset === "string") out.datePreset = patch.datePreset as Settings["datePreset"];
  if (typeof patch.demoMode === "boolean") out.demoMode = patch.demoMode;
  const nums: (keyof Settings)[] = [
    "targetRoas",
    "grossMargin",
    "minSpendToJudge",
    "maxFrequency",
    "minCtr",
    "maxCpm",
    "scaleStepPct",
  ];
  for (const k of nums) {
    const v = patch[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  if (out.grossMargin !== undefined) out.grossMargin = Math.min(0.99, Math.max(0.01, out.grossMargin));
  return out;
}

/** 回傳給前端時遮罩權杖 */
export function maskSettings(
  s: Settings,
): Settings & { hasToken: boolean; hasAnthropicKey: boolean; readOnlyStore: boolean } {
  const t = s.metaAccessToken;
  return {
    ...s,
    metaAccessToken: t ? `${t.slice(0, 6)}…${t.slice(-4)}` : "",
    hasToken: Boolean(t),
    hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    readOnlyStore: isReadOnlyStore,
  };
}
