/** 極簡 Markdown 渲染：標題、清單、粗體、段落。給 AI 建議用。 */
export function Markdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const out: React.ReactNode[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.type;
    out.push(
      <Tag key={out.length}>
        {list.items.map((it, i) => (
          <li key={i}>{inline(it)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };
  lines.forEach((raw) => {
    const line = raw.trimEnd();
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*•]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (h) {
      flush();
      const level = h[1].length;
      const Tag = (level === 1 ? "h2" : level === 2 ? "h3" : "h4") as "h2" | "h3" | "h4";
      out.push(<Tag key={out.length}>{inline(h[2])}</Tag>);
    } else if (ul) {
      if (!list || list.type !== "ul") {
        flush();
        list = { type: "ul", items: [] };
      }
      list.items.push(ul[1]);
    } else if (ol) {
      if (!list || list.type !== "ol") {
        flush();
        list = { type: "ol", items: [] };
      }
      list.items.push(ol[1]);
    } else if (line.trim() === "") {
      flush();
    } else {
      flush();
      out.push(<p key={out.length}>{inline(line)}</p>);
    }
  });
  flush();
  return <div className="prose-tw">{out}</div>;
}

function inline(s: string): React.ReactNode[] {
  const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i}>{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}
