import { NextResponse } from "next/server";
import { maskSettings, readSettings, writeSettings } from "@/lib/settings-store";
import type { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await readSettings();
  return NextResponse.json(maskSettings(s));
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Partial<Settings>;
  // 前端送回來的遮罩權杖不覆蓋原值
  if (typeof body.metaAccessToken === "string" && body.metaAccessToken.includes("…")) {
    delete body.metaAccessToken;
  }
  const s = await writeSettings(body);
  return NextResponse.json(maskSettings(s));
}
