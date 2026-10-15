"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/lib/types";

type Masked = Settings & { hasToken: boolean; hasAnthropicKey: boolean; readOnlyStore: boolean };

export default function SettingsPage() {
  const [s, setS] = useState<Masked | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setS);
  }, []);

  if (!s) return <div className="text-sm text-muted py-20 text-center">載入中…</div>;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS({ ...s, [k]: v });
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, Number(e.target.value) as never);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const body: Partial<Settings> = { ...s };
    if (tokenInput.trim()) body.metaAccessToken = tokenInput.trim();
    else delete body.metaAccessToken;
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as Masked;
    setS(json);
    setTokenInput("");
    setSaving(false);
    setMsg({ ok: res.ok, text: res.ok ? "已儲存。" : "儲存失敗。" });
  };

  const test = async () => {
    setTesting(true);
    setMsg(null);
    const res = await fetch("/api/test-connection", { method: "POST" });
    const json = await res.json();
    setTesting(false);
    setMsg(
      json.ok
        ? { ok: true, text: `連線成功：${json.name}（${json.currency}，帳戶狀態 ${json.status === 1 ? "正常" : json.status}）` }
        : { ok: false, text: json.error ?? "連線失敗" },
    );
  };

  const breakEven = 1 / Math.max(0.01, s.grossMargin);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">設定</h1>
        <p className="text-sm text-text-2 mt-1">
          這裡的數值會直接影響儀表板的建議。先把目標 ROAS 與毛利率填對，建議才會準。
        </p>
      </div>

      {s.readOnlyStore && (
        <div className="card p-3 text-sm text-serious border-serious/40">
          這個部署環境的檔案系統是唯讀的：這裡儲存的設定只會保留到伺服器實例重啟。
          要長期使用，請在部署平台（Cloudflare Workers 的 Secrets 或 Vercel 的 Environment Variables）設定 META_ACCESS_TOKEN 與 META_AD_ACCOUNT_ID，然後重新部署。
        </div>
      )}

      {msg && (
        <div className={`card p-3 text-sm ${msg.ok ? "text-good-text" : "text-critical"}`}>{msg.text}</div>
      )}

      <section className="card p-5 space-y-4">
        <h2 className="font-medium">資料來源</h2>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={s.demoMode} onChange={(e) => set("demoMode", e.target.checked)} />
          使用示範資料（關掉後才會讀 Meta 即時資料）
        </label>
        <Field label="廣告帳戶 ID" hint="純數字，不含 act_。可以在 Ads Manager 網址的 act= 後面找到。">
          <input className={inputCls} value={s.adAccountId} onChange={(e) => set("adAccountId", e.target.value)} placeholder="563790074363750" />
        </Field>
        <Field
          label="Meta 存取權杖"
          hint={
            s.hasToken
              ? `目前已儲存：${s.metaAccessToken}。要更換就在下面貼新的。`
              : "從 Meta 商業管理平台 → 系統用戶 → 產生權杖，需要 ads_read 權限。權杖只存在伺服器的 data/settings.json，不會傳到前端。"
          }
        >
          <input className={inputCls} type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="EAAG…" autoComplete="off" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="幣別">
            <select className={inputCls} value={s.currency} onChange={(e) => set("currency", e.target.value as Settings["currency"])}>
              {["TWD", "USD", "HKD", "JPY", "SGD", "MYR"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="分析區間">
            <select className={inputCls} value={s.datePreset} onChange={(e) => set("datePreset", e.target.value as Settings["datePreset"])}>
              <option value="last_7d">近 7 天</option>
              <option value="last_14d">近 14 天</option>
              <option value="last_30d">近 30 天</option>
              <option value="last_90d">近 90 天</option>
            </select>
          </Field>
        </div>
        <div className="flex gap-2">
          <button onClick={test} disabled={testing} className="px-3 py-1.5 rounded-md bg-surface-2 text-sm disabled:opacity-50">
            {testing ? "測試中…" : "測試 Meta 連線"}
          </button>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <h2 className="font-medium">目標與門檻</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="目標 ROAS" hint="例如 5 代表每花 1 元要回收 5 元營收。">
            <input className={inputCls} type="number" step="0.1" min="0.5" value={s.targetRoas} onChange={num("targetRoas")} />
          </Field>
          <Field label="毛利率" hint={`0–1 之間。損益兩平 ROAS = 1 ÷ 毛利率 = ${breakEven.toFixed(2)}×`}>
            <input className={inputCls} type="number" step="0.05" min="0.05" max="0.95" value={s.grossMargin} onChange={num("grossMargin")} />
          </Field>
          <Field label="判斷門檻花費" hint="活動花費低於這個數字前不做好壞判斷，避免小樣本誤判。建議設為 3–5 倍 CPA。">
            <input className={inputCls} type="number" step="100" min="0" value={s.minSpendToJudge} onChange={num("minSpendToJudge")} />
          </Field>
          <Field label="每次加碼幅度 %" hint="一次加太多會讓活動重新進入學習階段，20–30% 最安全。">
            <input className={inputCls} type="number" step="5" min="5" max="50" value={s.scaleStepPct} onChange={num("scaleStepPct")} />
          </Field>
          <Field label="頻率上限" hint="拓新活動超過 3 通常開始疲乏；再行銷可容忍 5–7。">
            <input className={inputCls} type="number" step="0.5" min="1" value={s.maxFrequency} onChange={num("maxFrequency")} />
          </Field>
          <Field label="CTR 下限 %" hint="電商素材 CTR（全部）低於 1% 通常是素材問題。">
            <input className={inputCls} type="number" step="0.1" min="0" value={s.minCtr} onChange={num("minCtr")} />
          </Field>
          <Field label="CPM 上限" hint="台灣電商拓新 CPM 常見 150–300，超過就要看受眾是否太窄。">
            <input className={inputCls} type="number" step="10" min="0" value={s.maxCpm} onChange={num("maxCpm")} />
          </Field>
        </div>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="font-medium">AI 建議</h2>
        <p className="text-sm text-text-2">
          {s.hasAnthropicKey
            ? "已偵測到 ANTHROPIC_API_KEY，儀表板的「AI 投手建議」可用。"
            : "尚未設定 ANTHROPIC_API_KEY。在 .env.local 加上 ANTHROPIC_API_KEY=sk-ant-… 後重啟即可啟用。"}
        </p>
      </section>

      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="px-4 py-2 rounded-md bg-series-1 text-white text-sm disabled:opacity-50">
          {saving ? "儲存中…" : "儲存設定"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-series-1/40";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <div className="font-medium mb-1">{label}</div>
      {children}
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </label>
  );
}
