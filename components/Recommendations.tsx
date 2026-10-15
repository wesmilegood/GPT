import type { Recommendation, Severity } from "@/lib/types";

const META: Record<Severity, { label: string; icon: string; cls: string; bar: string }> = {
  critical: { label: "立即處理", icon: "⛔", cls: "text-critical", bar: "bg-critical" },
  warning: { label: "需要優化", icon: "⚠️", cls: "text-serious", bar: "bg-serious" },
  good: { label: "可以加碼", icon: "✅", cls: "text-good-text", bar: "bg-good" },
  info: { label: "提醒", icon: "ℹ️", cls: "text-info", bar: "bg-info" },
};

export function Recommendations({ items }: { items: Recommendation[] }) {
  if (items.length === 0) {
    return <div className="card p-6 text-text-2 text-sm">目前沒有建議。等活動累積足夠花費後會自動出現。</div>;
  }
  return (
    <div className="grid gap-3">
      {items.map((r) => {
        const m = META[r.severity];
        return (
          <details key={r.id} className="card overflow-hidden group" open={r.severity === "critical"}>
            <summary className="flex items-stretch cursor-pointer list-none">
              <div className={`w-1.5 shrink-0 ${m.bar}`} aria-hidden />
              <div className="p-4 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`font-medium ${m.cls}`}>
                    {m.icon} {m.label}
                  </span>
                  {r.campaignName && <span className="text-muted truncate max-w-[60ch]">· {r.campaignName}</span>}
                  {!r.campaignName && <span className="text-muted">· 帳戶層級</span>}
                </div>
                <div className="font-medium mt-1">{r.title}</div>
                {r.metric && (
                  <div className="text-xs text-text-2 mt-1 tabular">
                    {r.metric.label} <span className="font-semibold text-text">{r.metric.value}</span>
                    {r.metric.target && <span className="text-muted">（目標 {r.metric.target}）</span>}
                  </div>
                )}
              </div>
              <div className="px-4 self-center text-muted text-sm group-open:rotate-180 transition">▾</div>
            </summary>
            <div className="px-4 pb-4 pl-6 text-sm">
              <div className="mt-1">
                <span className="text-muted">為什麼：</span>
                <span className="text-text-2">{r.why}</span>
              </div>
              <div className="mt-2">
                <span className="text-muted">怎麼做：</span>
                <span>{r.action}</span>
              </div>
              <ol className="mt-2 ml-5 list-decimal space-y-1 text-text-2">
                {r.steps.map((st, i) => (
                  <li key={i}>{st}</li>
                ))}
              </ol>
            </div>
          </details>
        );
      })}
    </div>
  );
}
