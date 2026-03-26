import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const OPENFORT_SECRET_KEY = process.env.OPENFORT_SECRET_KEY ?? "";

/** Verify Telegram initData signature */
function verifyTelegramInitData(initData: string): Record<string, string> | null {
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

    const result: Record<string, string> = {};
    params.forEach((v, k) => { result[k] = v; });
    return result;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
    }

    const data = verifyTelegramInitData(initData);
    if (!data) {
      return NextResponse.json({ error: "Invalid Telegram auth" }, { status: 401 });
    }

    const user = JSON.parse(data.user ?? "{}");
    const telegramId = String(user.id ?? "");

    if (!telegramId) {
      return NextResponse.json({ error: "No user ID in initData" }, { status: 400 });
    }

    // Authenticate with Openfort using custom token
    const openfortRes = await fetch("https://api.openfort.xyz/iam/v1/auth/guest", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENFORT_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        externalUserId: `telegram_${telegramId}`,
      }),
    });

    if (!openfortRes.ok) {
      const err = await openfortRes.text();
      console.error("Openfort auth error:", err);
      return NextResponse.json({ error: "Openfort auth failed" }, { status: 500 });
    }

    const { token } = await openfortRes.json();
    return NextResponse.json({ token });
  } catch (e) {
    console.error("Auth route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
