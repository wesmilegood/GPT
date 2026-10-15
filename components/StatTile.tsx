export function StatTile({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "warning" | "critical";
}) {
  const toneClass =
    tone === "good" ? "text-good-text" : tone === "warning" ? "text-serious" : tone === "critical" ? "text-critical" : "text-text";
  return (
    <div className="card p-4 min-w-0">
      <div className="text-xs text-muted">{label}</div>
      <div className={`text-2xl font-semibold mt-1 truncate ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-text-2 mt-1 truncate">{sub}</div>}
    </div>
  );
}
