import { NextRequest, NextResponse } from "next/server";

const SHIELD_SECRET_KEY = process.env.SHIELD_SECRET_KEY ?? "";
const SHIELD_ENCRYPTION_SHARE = process.env.SHIELD_ENCRYPTION_SHARE ?? "";
const OPENFORT_SECRET_KEY = process.env.OPENFORT_SECRET_KEY ?? "";

export async function POST(req: NextRequest) {
  try {
    if (!SHIELD_SECRET_KEY || !SHIELD_ENCRYPTION_SHARE) {
      return NextResponse.json({ error: "Shield keys not configured" }, { status: 500 });
    }

    // Get user auth token from the Openfort SDK request
    const authHeader = req.headers.get("Authorization");

    // Call Shield API to get encrypted session
    const shieldRes = await fetch("https://shield.openfort.xyz/api/v1/encryption-sessions", {
      method: "POST",
      headers: {
        "x-openfort-api-key": OPENFORT_SECRET_KEY,
        "x-shield-api-key": SHIELD_SECRET_KEY,
        "x-shield-encryption-share": SHIELD_ENCRYPTION_SHARE,
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({}),
    });

    if (!shieldRes.ok) {
      const errText = await shieldRes.text();
      console.error("Shield API error:", shieldRes.status, errText);
      return NextResponse.json({ error: "Shield error" }, { status: 502 });
    }

    const data = await shieldRes.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Shield session route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
