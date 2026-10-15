import { NextResponse } from "next/server";
import { loadInsights } from "@/lib/insights";
import { MetaApiError } from "@/lib/meta";
import { readSettings } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await readSettings();
  try {
    const payload = await loadInsights(settings);
    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof MetaApiError) {
      return NextResponse.json(
        { error: `Meta API 錯誤：${err.message}`, code: err.code, subcode: err.subcode },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
