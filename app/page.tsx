"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CampaignRoasBars, RoasTrend, SpendRevenue } from "@/components/Charts";
import { CampaignTable } from "@/components/CampaignTable";
import { Markdown } from "@/components/Markdown";
import { Recommendations } from "@/components/Recommendations";
import { StatTile } from "@/components/StatTile";
import { fmtMoney, fmtNum, fmtPct, fmtRoas } from "@/lib/format";
import type { InsightsPayload } from "@/lib/types";

async function fetchInsights(): Promise<InsightsPayload> {
  const res = await fetch("/api/insights", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as InsightsPayload;
}

const PRESET_LABEL: Record<string, string> = {
  last_7d: "近 7 天",
  last_14d: "近 14 天",
  last_30d: "近 30 天",
  last_90d: "近 90 天",
};

export default function Dashboard() {
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceErr, setAdviceErr] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const run = useCallback(async () => {
    try {
      const payload = await fetchInsights();
      setData(payload);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    void run();
  }, [run]);

  useEffect(() => {
    let alive = true;
    fetchInsights()
      .then((payload) => {
        if (!alive) return;
        setData(payload);
        setError(null);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const askAi = async () => {
    setAdviceLoading(true);
    setAdviceErr(null);
    try {
      const res = await fetch("/api/advice", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setAdvice(json.advice as string);
    } catch (e) {
      setAdviceErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAdviceLoading(false);
    }
  };

  if (error) {
    return (
      <div className="card p-6">
        <div className="font-medium text-critical">讀取失敗</div>
        <p className="text-sm text-text-2 mt-1">{error}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={load} className="px-3 py-1.5 rounded-md bg-surface-2 text-sm">重試</button>
          <Link href="/settings" className="px-3 py-1.5 rounded-md bg-surface-2 text-sm">去設定</Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-muted py-20 text-center">載入中…</div>;
  }

  const s = data.summary;
  const cur = data.currency;
  const roasTone = s.spend === 0 ? "neutral" : s.roas >= data.targetRoas ? "good" : s.roas < data.breakEvenRoas ? "critical" : "warning";
  const critical = data.recommendations.filter((r) => r.severity === "critical").length;
  const scalable = data.recommendations.filter((r) => r.severity === "good" && r.campaignId).length;

  return (
    <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{data.accountName}</h1>
          <div className="text-xs text-muted mt-0.5">
            {PRESET_LABEL[data.datePreset]} ·{" "}
            {data.source === "demo" ? (
              <span className="text-serious">示範資料</span>
            ) : (
              <span className="text-good-text">Meta 即時資料</span>
            )}{" "}
            · 更新於 {new Date(data.fetchedAt).toLocaleTimeString("zh-TW")}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 rounded-md bg-surface-2 text-sm hover:bg-border">重新整理</button>
          <Link href="/settings" className="px-3 py-1.5 rounded-md bg-surface-2 text-sm hover:bg-border">設定</Link>
        </div>
      </div>

      {data.warnings.length > 0 && (
        <div className="card p-3 text-sm border-serious/40 bg-serious/5">
          {data.warnings.map((w, i) => (
            <div key={i}>⚠️ {w}</div>
          ))}
        </div>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile label="帳戶 ROAS" value={fmtRoas(s.roas)} sub={`目標 ${fmtRoas(data.targetRoas)} · 損益兩平 ${fmtRoas(data.breakEvenRoas)}`} tone={roasTone} />
        <StatTile label="花費" value={fmtMoney(s.spend, cur)} sub={`${fmtNum(s.impressions)} 次曝光`} />
        <StatTile label="營收" value={fmtMoney(s.revenue, cur)} sub={`${fmtNum(s.purchases)} 筆購買`} />
        <StatTile label="CPA" value={fmtMoney(s.cpa, cur)} sub={`客單價 ${fmtMoney(s.aov, cur)}`} />
        <StatTile label="CTR" value={fmtPct(s.ctr)} sub={`CPM ${fmtMoney(s.cpm, cur)}`} />
        <StatTile label="頻率" value={fmtNum(s.frequency, 2)} sub={`觸及 ${fmtNum(s.reach)}`} />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-medium">調整建議</h2>
          <div className="text-xs text-muted">
            {critical > 0 && <span className="text-critical">{critical} 項需立即處理</span>}
            {critical > 0 && scalable > 0 && " · "}
            {scalable > 0 && <span className="text-good-text">{scalable} 個活動可加碼</span>}
          </div>
        </div>
        <Recommendations items={data.recommendations} />
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <RoasTrend daily={data.daily} target={data.targetRoas} breakEven={data.breakEvenRoas} />
        <SpendRevenue daily={data.daily} currency={cur} />
      </section>

      <section>
        <CampaignRoasBars campaigns={data.campaigns} target={data.targetRoas} breakEven={data.breakEvenRoas} />
      </section>

      <section>
        <h2 className="font-medium mb-2">活動明細</h2>
        <CampaignTable campaigns={data.campaigns} currency={cur} target={data.targetRoas} breakEven={data.breakEvenRoas} />
      </section>

      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-medium">AI 投手建議（Claude）</h2>
            <div className="text-xs text-muted">把目前的數據交給 Claude 做交叉判斷，補充規則引擎沒看到的地方。需要設定 ANTHROPIC_API_KEY。</div>
          </div>
          <button
            onClick={askAi}
            disabled={adviceLoading}
            className="px-3 py-1.5 rounded-md bg-series-1 text-white text-sm disabled:opacity-50"
          >
            {adviceLoading ? "分析中…" : advice ? "重新分析" : "產生建議"}
          </button>
        </div>
        {adviceErr && <div className="text-sm text-critical mt-3">{adviceErr}</div>}
        {advice && (
          <div className="mt-3 text-sm">
            <Markdown text={advice} />
          </div>
        )}
      </section>
    </div>
  );
}
