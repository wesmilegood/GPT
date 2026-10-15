"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "儀表板" },
  { href: "/playbook", label: "ROAS 5 攻略" },
  { href: "/settings", label: "設定" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        <Link href="/" className="font-semibold tracking-tight">
          Meta 廣告 <span className="text-series-1">ROAS</span> 儀表板
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md transition ${
                  active ? "bg-surface-2 text-text font-medium" : "text-text-2 hover:bg-surface-2"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
