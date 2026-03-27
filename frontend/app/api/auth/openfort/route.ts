import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const OPENFORT_SECRET_KEY = process.env.OPENFORT_SECRET_KEY ?? "";

/** Verify Telegram initData signature */
function verifyTelegramInitData(initData: string): { id: string; username?: string } | null {
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
    return { id: String(user.id), username: user.username };
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

    if (!OPENFORT_SECRET_KEY) {
      return NextResponse.json({ error: "OPENFORT_SECRET_KEY not configured" }, { status: 500 });
    }

    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) {
      return NextResponse.json({ error: "Invalid Telegram auth" }, { status: 401 });
    }

    // Create or retrieve Openfort user session for this Telegram user
    // Uses guest login tied to externalId = telegram_{id}
    const openfortRes = await fetch("https://api.openfort.xyz/iam/v1/authentication/login-as-guest", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENFORT_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        externalUserId: `telegram_${tgUser.id}`,
      }),
    });

    if (!openfortRes.ok) {
      const errText = await openfortRes.text();
      console.error("Openfort API error:", openfortRes.status, errText);
      // Return null token so frontend falls back to client-side guest
      return NextResponse.json({ token: null, userId: null });
    }

    const data = await openfortRes.json();
    return NextResponse.json({
      token: data.token ?? data.accessToken ?? null,
      userId: data.user?.id ?? tgUser.id,
    });
  } catch (e) {
    console.error("Auth route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
