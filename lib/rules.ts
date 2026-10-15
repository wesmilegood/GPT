import { fmtMoney, fmtNum, fmtPct, fmtRoas } from "./format";
import type { AccountSummary, CampaignMetrics, DailyPoint, Recommendation, Settings } from "./types";

const SALES_OBJECTIVES = new Set([
  "OUTCOME_SALES",
  "CONVERSIONS",
  "PRODUCT_CATALOG_SALES",
  "OUTCOME_APP_PROMOTION",
]);

export function isSalesObjective(objective: string): boolean {
  return SALES_OBJECTIVES.has(objective);
}

export function breakEvenRoas(grossMargin: number): number {
  return 1 / Math.max(0.01, Math.min(0.99, grossMargin));
}

/**
 * 規則引擎：根據每個活動的指標與使用者設定，產出可執行的建議。
 * 規則順序 = 嚴重度順序：先處理燒錢的，再處理可加碼的，最後是體質優化。
 */
export function buildRecommendations(
  campaigns: CampaignMetrics[],
  summary: AccountSummary,
  daily: DailyPoint[],
  s: Settings,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const be = breakEvenRoas(s.grossMargin);
  const target = s.targetRoas;
  const cur = s.currency;
  const step = s.scaleStepPct;

  const active = campaigns.filter((c) => c.status === "ACTIVE" && c.spend > 0);

  // ---- 帳戶層級 ----
  if (summary.spend > 0) {
    if (summary.roas < be) {
      recs.push({
        id: "acct-below-breakeven",
        severity: "critical",
        campaignId: null,
        campaignName: null,
        title: `帳戶整體 ROAS ${fmtRoas(summary.roas)}，低於損益兩平 ${fmtRoas(be)}`,
        why: `以毛利率 ${fmtPct(s.grossMargin * 100, 0)} 計算，ROAS 要 ≥ ${fmtRoas(be)} 才不賠錢。現在每花 ${fmtMoney(100, cur)} 只回收 ${fmtMoney(summary.roas * 100, cur)} 營收。`,
        action: "先止血：暫停 ROAS 低於損益兩平且花費已超過判斷門檻的活動，預算集中到表現最好的 1–2 個活動。",
        steps: [
          "把預算從 ROAS < 損益兩平的活動移到 ROAS 最高的活動（見下方個別建議）",
          "確認 Pixel / CAPI 的「購買」事件有正常回傳，否則 ROAS 會被低估",
          "若全部活動都低於損益兩平，問題多半在素材或落地頁，而不是受眾",
        ],
        metric: { label: "帳戶 ROAS", value: fmtRoas(summary.roas), target: `≥ ${fmtRoas(be)}` },
      });
    } else if (summary.roas < target) {
      recs.push({
        id: "acct-below-target",
        severity: "warning",
        campaignId: null,
        campaignName: null,
        title: `帳戶 ROAS ${fmtRoas(summary.roas)}，有獲利但未達目標 ${fmtRoas(target)}`,
        why: `距離目標還差 ${fmtRoas(target - summary.roas)}。要拉高平均 ROAS，最有效的是「把預算往高 ROAS 活動集中」而不是全面縮減。`,
        action: "重新分配預算：高於目標的活動加碼，低於損益兩平的活動減碼或暫停。",
        steps: [
          `每 3–4 天把達標活動的預算加 ${step}%（一次不要超過 20–30%，避免重新進入學習階段）`,
          "未達標但高於損益兩平的活動：先換素材再決定去留，不要急著關",
          "檢查結帳流程：加入購物車 → 購買的轉換率低於 10% 代表落地頁/運費/付款有阻力",
        ],
        metric: { label: "帳戶 ROAS", value: fmtRoas(summary.roas), target: `≥ ${fmtRoas(target)}` },
      });
    } else {
      recs.push({
        id: "acct-on-target",
        severity: "good",
        campaignId: null,
        campaignName: null,
        title: `帳戶 ROAS ${fmtRoas(summary.roas)} 已達目標 ${fmtRoas(target)}`,
        why: "整體獲利健康。這時候的重點是「在不讓 ROAS 掉太多的前提下放大花費」。",
        action: "穩定加碼，並持續補新素材，避免受眾疲乏後 ROAS 下滑。",
        steps: [
          `對達標活動每週加碼一次，每次 ${step}%，觀察 3 天 ROAS 是否仍 ≥ ${fmtRoas(target)}`,
          "每週至少上 2–3 組新素材到表現最好的活動，讓系統有東西可以輪替",
          "建立「ROAS 下滑 20% 就回退預算」的自動規則（Ads Manager → 自動規則）",
        ],
      });
    }
  }

  // ---- 趨勢：近 7 天 vs 前 7 天 ----
  if (daily.length >= 14) {
    const recent = daily.slice(-7);
    const prior = daily.slice(-14, -7);
    const r = agg(recent);
    const p = agg(prior);
    if (p.spend > 0 && r.spend > 0) {
      const delta = (r.roas - p.roas) / Math.max(0.01, p.roas);
      if (delta <= -0.2) {
        recs.push({
          id: "trend-roas-drop",
          severity: "warning",
          campaignId: null,
          campaignName: null,
          title: `近 7 天 ROAS 較前 7 天下滑 ${fmtPct(Math.abs(delta) * 100, 0)}`,
          why: `前 7 天 ${fmtRoas(p.roas)} → 近 7 天 ${fmtRoas(r.roas)}。連續下滑通常是素材疲乏、頻率升高，或競品活動期拉高 CPM。`,
          action: "先換素材、再看頻率，最後才調受眾。",
          steps: [
            "找出近 7 天 ROAS 掉最多的活動，先上新素材（新鉤子/新開頭 3 秒）",
            "若頻率 > 3，排除近 30 天已購買者，或擴大受眾",
            "檢查近期是否有大型檔期（雙 11、週年慶）推高 CPM，若是，暫時接受較低 ROAS 或避開高峰",
          ],
          metric: { label: "ROAS 週變化", value: fmtPct(delta * 100, 0), target: "≥ -10%" },
        });
      } else if (delta >= 0.2) {
        recs.push({
          id: "trend-roas-up",
          severity: "good",
          campaignId: null,
          campaignName: null,
          title: `近 7 天 ROAS 較前 7 天上升 ${fmtPct(delta * 100, 0)}`,
          why: `前 7 天 ${fmtRoas(p.roas)} → 近 7 天 ${fmtRoas(r.roas)}。成效在往上走，是加碼的好時機。`,
          action: "趁勢加碼，但一次不超過 20–30%。",
          steps: [`對帶動上升的活動加碼 ${step}%`, "把表現最好的素材複製到其他活動"],
        });
      }
    }
  }

  // ---- 活動層級 ----
  for (const c of active) {
    const judged = c.spend >= s.minSpendToJudge;
    const sales = isSalesObjective(c.objective);

    // 非銷售目標卻在花錢
    if (!sales && c.spend >= s.minSpendToJudge * 0.5) {
      recs.push({
        id: `obj-${c.id}`,
        severity: c.roas < be ? "warning" : "info",
        campaignId: c.id,
        campaignName: c.name,
        title: "活動目標不是「銷售」，系統不會幫你找會買的人",
        why: `這個活動的目標是 ${objectiveLabel(c.objective)}，Meta 只會優化點擊或互動，不會優化購買。它的 ROAS ${fmtRoas(c.roas)} 幾乎注定偏低。`,
        action: "除非有明確的品牌或導流用途，否則把預算轉到「銷售」目標、以「購買」為轉換事件的活動。",
        steps: [
          "新建活動 → 目標選「銷售」→ 轉換事件選「購買」",
          "用同一組素材重新上，比較 7 天後的 CPA 與 ROAS",
          "若只是想要互動/觸及，把預算控制在總預算的 10% 以內",
        ],
        metric: { label: "花費", value: fmtMoney(c.spend, cur) },
      });
      continue;
    }

    if (!judged) {
      if (sales) {
        recs.push({
          id: `learn-${c.id}`,
          severity: "info",
          campaignId: c.id,
          campaignName: c.name,
          title: `花費 ${fmtMoney(c.spend, cur)} 尚未達判斷門檻 ${fmtMoney(s.minSpendToJudge, cur)}`,
          why: "樣本太小時 ROAS 會大幅波動，現在調整容易誤判。學習階段通常需要 7 天內累積約 50 次轉換。",
          action: "先不要動它。讓它跑到門檻再評估。",
          steps: ["學習階段內不要改預算、受眾、素材", "若 7 天後仍無法累積轉換，考慮把轉換事件改成「加入購物車」讓系統先有訊號"],
        });
      }
      continue;
    }

    if (c.roas < be) {
      recs.push({
        id: `kill-${c.id}`,
        severity: "critical",
        campaignId: c.id,
        campaignName: c.name,
        title: `ROAS ${fmtRoas(c.roas)} 低於損益兩平 ${fmtRoas(be)}，正在賠錢`,
        why: `已花 ${fmtMoney(c.spend, cur)}，回收 ${fmtMoney(c.revenue, cur)}。${diagnose(c, s)}`,
        action: c.ctr < s.minCtr ? "先換素材測 3 天，仍低於損益兩平就暫停。" : "暫停或把預算砍到最低，資金移到達標活動。",
        steps: [
          `預算先降 50%（${c.dailyBudget ? fmtMoney(c.dailyBudget, cur) + " → " + fmtMoney(c.dailyBudget / 2, cur) : "依現況"}）`,
          c.ctr < s.minCtr ? "上 2–3 組新素材（換開頭 3 秒、換主張），只留 CTR 最高的" : "檢查落地頁：速度、價格、運費、信任元素",
          "3 天後仍低於損益兩平 → 暫停",
        ],
        metric: { label: "ROAS", value: fmtRoas(c.roas), target: `≥ ${fmtRoas(be)}` },
      });
      continue;
    }

    if (c.roas >= target) {
      const fatigued = c.frequency > s.maxFrequency;
      recs.push({
        id: `scale-${c.id}`,
        severity: "good",
        campaignId: c.id,
        campaignName: c.name,
        title: `ROAS ${fmtRoas(c.roas)} 達標，可以加碼`,
        why: `這是帳戶的獲利引擎。${fatigued ? `但頻率 ${fmtNum(c.frequency, 1)} 偏高，受眾快看膩了，加碼前先擴受眾。` : `頻率 ${fmtNum(c.frequency, 1)} 還健康，有加碼空間。`}`,
        action: fatigued
          ? "先擴大受眾或排除已購買者，再加碼。"
          : `每 3–4 天加 ${step}%，直到 ROAS 掉到接近目標為止。`,
        steps: [
          c.dailyBudget
            ? `日預算 ${fmtMoney(c.dailyBudget, cur)} → ${fmtMoney(c.dailyBudget * (1 + step / 100), cur)}`
            : `預算加 ${step}%`,
          fatigued ? "受眾排除：近 30 天購買者；或改用 Advantage+ 受眾擴大" : "複製最好的素材做 2 個變體，餵給系統輪替",
          "若加碼後 ROAS 掉超過 20%，回退到上一個預算",
        ],
        metric: { label: "ROAS", value: fmtRoas(c.roas), target: `≥ ${fmtRoas(target)}` },
      });
    } else {
      // 介於損益兩平與目標之間
      recs.push({
        id: `improve-${c.id}`,
        severity: "warning",
        campaignId: c.id,
        campaignName: c.name,
        title: `ROAS ${fmtRoas(c.roas)} 有賺但未達目標 ${fmtRoas(target)}`,
        why: diagnose(c, s),
        action: "維持預算，針對最弱的環節優化。",
        steps: improvementSteps(c, s),
        metric: { label: "ROAS", value: fmtRoas(c.roas), target: `≥ ${fmtRoas(target)}` },
      });
    }

    // 補充性體質警示（不重複主建議）
    if (c.frequency > s.maxFrequency && c.roas >= be) {
      recs.push({
        id: `freq-${c.id}`,
        severity: "warning",
        campaignId: c.id,
        campaignName: c.name,
        title: `頻率 ${fmtNum(c.frequency, 1)}，超過上限 ${s.maxFrequency}`,
        why: "同一個人平均已看到超過上限次數。再行銷活動可以容忍較高頻率，但拓新活動超過 3 通常 CTR 會開始掉、CPM 上升。",
        action: "擴大受眾或排除已轉換者，並換素材。",
        steps: ["受眾排除近 30/60 天購買者", "加入 Advantage+ 受眾或相似受眾 1–3%", "素材至少換掉一半"],
        metric: { label: "頻率", value: fmtNum(c.frequency, 1), target: `≤ ${s.maxFrequency}` },
      });
    }
    if (c.cpm > s.maxCpm && c.roas >= be) {
      recs.push({
        id: `cpm-${c.id}`,
        severity: "info",
        campaignId: c.id,
        campaignName: c.name,
        title: `CPM ${fmtMoney(c.cpm, cur)} 高於上限 ${fmtMoney(s.maxCpm, cur)}`,
        why: "CPM 偏高代表受眾太窄、競爭激烈，或素材品質分數低。拓新活動 CPM 高會直接吃掉 ROAS。",
        action: "放寬受眾、改用 Advantage+ 版位，並檢查素材品質排名。",
        steps: ["受眾從興趣鎖定改為廣泛受眾（只設年齡、地區）", "版位改為 Advantage+ 版位", "在廣告層級看「品質排名」，低於平均就換素材"],
        metric: { label: "CPM", value: fmtMoney(c.cpm, cur), target: `≤ ${fmtMoney(s.maxCpm, cur)}` },
      });
    }
  }

  const order: Record<Recommendation["severity"], number> = { critical: 0, warning: 1, good: 2, info: 3 };
  return recs.sort((a, b) => order[a.severity] - order[b.severity]);
}

function agg(points: DailyPoint[]) {
  const spend = points.reduce((a, p) => a + p.spend, 0);
  const revenue = points.reduce((a, p) => a + p.revenue, 0);
  return { spend, revenue, roas: spend > 0 ? revenue / spend : 0 };
}

function diagnose(c: CampaignMetrics, s: Settings): string {
  const parts: string[] = [];
  if (c.ctr < s.minCtr) parts.push(`CTR ${fmtPct(c.ctr)} 偏低（門檻 ${fmtPct(s.minCtr, 1)}），素材吸引力不足`);
  if (c.cpm > s.maxCpm) parts.push(`CPM ${fmtMoney(c.cpm, s.currency)} 偏高，受眾太窄或競價過熱`);
  if (c.frequency > s.maxFrequency) parts.push(`頻率 ${fmtNum(c.frequency, 1)} 偏高，受眾疲乏`);
  const lpvRate = c.linkClicks > 0 ? c.landingPageViews / c.linkClicks : 1;
  if (c.linkClicks > 50 && lpvRate < 0.6) parts.push(`連結點擊 → 落地頁瀏覽只有 ${fmtPct(lpvRate * 100, 0)}，頁面載入太慢`);
  const atcToPurchase = c.addToCart > 0 ? c.purchases / c.addToCart : 1;
  if (c.addToCart > 20 && atcToPurchase < 0.15) parts.push(`加入購物車 → 購買只有 ${fmtPct(atcToPurchase * 100, 0)}，結帳流程有阻力`);
  if (parts.length === 0) parts.push(`CTR ${fmtPct(c.ctr)}、CPM ${fmtMoney(c.cpm, s.currency)}、頻率 ${fmtNum(c.frequency, 1)} 都在正常範圍，差距主要來自客單價 ${fmtMoney(c.aov, s.currency)} 或轉換率`);
  return parts.join("；") + "。";
}

function improvementSteps(c: CampaignMetrics, s: Settings): string[] {
  const steps: string[] = [];
  if (c.ctr < s.minCtr) steps.push("素材：上 3 組新素材，每組不同切角（痛點／社會證明／限時優惠），3 天後只留最好的");
  if (c.cpm > s.maxCpm) steps.push("受眾：放寬鎖定、開啟 Advantage+ 受眾，讓系統找便宜的曝光");
  if (c.frequency > s.maxFrequency) steps.push("頻率：排除近 30 天購買者、加入新的相似受眾");
  const atcToPurchase = c.addToCart > 0 ? c.purchases / c.addToCart : 1;
  if (c.addToCart > 20 && atcToPurchase < 0.15) steps.push("結帳：檢查運費門檻、付款方式、是否能一頁結帳；對加入購物車未結帳者做再行銷");
  if (c.aov > 0) steps.push(`客單價：目前 ${fmtMoney(c.aov, s.currency)}，加上組合價／滿額贈，客單價 +15% 等於 ROAS 直接 +15%`);
  if (steps.length < 2) steps.push("出價：若轉換數穩定（每週 ≥ 50），試「最低 ROAS」出價策略，設為目標 ROAS 的 80%");
  return steps;
}

export function objectiveLabel(o: string): string {
  const map: Record<string, string> = {
    OUTCOME_SALES: "銷售",
    CONVERSIONS: "轉換（舊版）",
    PRODUCT_CATALOG_SALES: "目錄銷售",
    OUTCOME_TRAFFIC: "流量",
    LINK_CLICKS: "連結點擊（舊版）",
    OUTCOME_ENGAGEMENT: "互動",
    POST_ENGAGEMENT: "貼文互動（舊版）",
    OUTCOME_AWARENESS: "知名度",
    BRAND_AWARENESS: "品牌知名度（舊版）",
    REACH: "觸及（舊版）",
    OUTCOME_LEADS: "名單",
    VIDEO_VIEWS: "影片觀看（舊版）",
  };
  return map[o] ?? o;
}
