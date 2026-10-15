// Cloudflare Workers 進入點：在 OpenNext 產生的 worker 外面包一層可選的密碼保護。
// 設定 secret DASHBOARD_PASSWORD 後整站需要 HTTP Basic Auth（帳號隨意，密碼填該值）；沒設定就完全開放。
// @ts-expect-error 由 `opennextjs-cloudflare build` 產生
import openNext from "./.open-next/worker.js";
// @ts-expect-error 同上
export * from "./.open-next/worker.js";

interface Env {
  DASHBOARD_PASSWORD?: string;
  [key: string]: unknown;
}

interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function authorized(request: Request, password: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    return (idx >= 0 ? decoded.slice(idx + 1) : decoded) === password;
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const password = env.DASHBOARD_PASSWORD;
    if (password && !authorized(request, password)) {
      return new Response("需要密碼", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Meta Ads ROAS Dashboard", charset="UTF-8"' },
      });
    }
    return openNext.fetch(request, env, ctx);
  },
};
