import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { fmtMoney, fmtNum, fmtPct, fmtRoas } from "@/lib/format";
import { loadInsights } from "@/lib/insights";
import { objectiveLabel } from "@/lib/rules";
import { readSettings } from "@/lib/settings-store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SYSTEM = `你是資深的 Meta 廣告投手，專長是電商帳戶把 ROAS 拉到 5 以上。
使用者會給你帳戶摘要、各活動指標、以及規則引擎已經產出的建議。
請用繁體中文（台灣用語）回覆，給出：
1. 一句話總結帳戶現況（賺錢／打平／賠錢，主因是什麼）
2. 本週最重要的 3 個動作，每個動作要寫清楚「改哪個活動、改成什麼數值、預期影響」
3. 一個需要避免的常見錯誤
格式用 Markdown 的標題與清單，整體不超過 350 字。不要重複規則引擎已經講過的字句，要補充它沒看到的交叉判斷。`;

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "尚未設定 ANTHROPIC_API_KEY，AI 建議功能停用。規則引擎的建議仍可使用。" },
      { status: 400 },
    );
  }
  const settings = await readSettings();
  const data = await loadInsights(settings);
  const cur = data.currency;

  const lines: string[] = [];
  lines.push(`帳戶：${data.accountName}（${data.source === "demo" ? "示範資料" : "Meta 即時資料"}），區間 ${data.datePreset}`);
  lines.push(`目標 ROAS ${fmtRoas(data.targetRoas)}，損益兩平 ROAS ${fmtRoas(data.breakEvenRoas)}（毛利率 ${fmtPct(settings.grossMargin * 100, 0)}）`);
  const s = data.summary;
  lines.push(
    `帳戶總覽：花費 ${fmtMoney(s.spend, cur)}、營收 ${fmtMoney(s.revenue, cur)}、ROAS ${fmtRoas(s.roas)}、購買 ${fmtNum(s.purchases)}、CPA ${fmtMoney(s.cpa, cur)}、客單價 ${fmtMoney(s.aov, cur)}、CTR ${fmtPct(s.ctr)}、CPM ${fmtMoney(s.cpm, cur)}、頻率 ${fmtNum(s.frequency, 2)}`,
  );
  lines.push("活動：");
  for (const c of data.campaigns) {
    lines.push(
      `- ${c.name}｜目標 ${objectiveLabel(c.objective)}｜${c.status}｜日預算 ${c.dailyBudget ? fmtMoney(c.dailyBudget, cur) : "—"}｜花費 ${fmtMoney(c.spend, cur)}｜ROAS ${fmtRoas(c.roas)}｜購買 ${c.purchases}｜CPA ${fmtMoney(c.cpa, cur)}｜CTR ${fmtPct(c.ctr)}｜CPM ${fmtMoney(c.cpm, cur)}｜頻率 ${fmtNum(c.frequency, 2)}｜加入購物車 ${c.addToCart}｜結帳 ${c.initiateCheckout}`,
    );
  }
  lines.push("規則引擎建議（已顯示給使用者）：");
  for (const r of data.recommendations.slice(0, 8)) {
    lines.push(`- [${r.severity}] ${r.campaignName ?? "帳戶"}：${r.title}`);
  }

  const client = new Anthropic();
  try {
    const stream = client.beta.messages.stream({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: lines.join("\n") }],
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") {
      return NextResponse.json({ error: "模型拒絕回覆這次請求，請稍後再試。" }, { status: 502 });
    }
    const text = msg.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return NextResponse.json({ advice: text, model: msg.model });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY 無效。" }, { status: 401 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Claude API 流量限制，請稍後再試。" }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Claude API 錯誤 ${err.status}：${err.message}` }, { status: 502 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
