import { NextResponse } from "next/server";
import { MetaApiError, testConnection } from "@/lib/meta";
import { readSettings } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

export async function POST() {
  const s = await readSettings();
  if (!s.metaAccessToken || !s.adAccountId) {
    return NextResponse.json({ ok: false, error: "請先填入存取權杖與廣告帳戶 ID。" }, { status: 400 });
  }
  try {
    const r = await testConnection(s);
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    const msg = err instanceof MetaApiError ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
