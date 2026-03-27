import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

/**
 * Verifies Telegram initData signature and returns the Telegram user.
 *
 * Note: With Privy v2, Telegram Mini App login is handled natively by
 * `useLoginWithTelegram()` which reads window.Telegram.WebApp.initData
 * automatically — no backend call is required for auth.
 *
 * This endpoint is kept for optional server-side verification flows.
 */
function verifyTelegramInitData(initData: string): { id: string } | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;

    params.delete("hash");
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    const expectedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (expectedHash !== hash) return null;

    const userParam = params.get("user");
    if (!userParam) return null;
    const user = JSON.parse(userParam);
    return { id: String(user.id) };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN not configured" },
        { status: 500 },
      );
    }

    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) {
      return NextResponse.json(
        { error: "Invalid Telegram auth" },
        { status: 401 },
      );
    }

    // Return verified Telegram user data
    return NextResponse.json({ userId: `telegram_${tgUser.id}`, verified: true });
  } catch (e) {
    console.error("Telegram verification error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
