import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email().max(320),
});

const defaultAdmin = "admin@cloneit.site";

/**
 * Sends an email to the site admin when a new account is created.
 * Configure RESEND_API_KEY (https://resend.com). In production, verify your domain
 * and set RESEND_FROM_EMAIL to an address on that domain.
 */
export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[notify-signup] RESEND_API_KEY is not set; skipping admin notification");
    return NextResponse.json({ ok: true, notified: false });
  }

  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL ?? defaultAdmin;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "Simple Site <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [adminTo],
        subject: "New Simple Site account registration",
        text: `A new user registered with this email address:\n\n${email}\n`,
        reply_to: email,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[notify-signup] Resend API error:", res.status, errText);
    }
  } catch (err) {
    console.error("[notify-signup] Request failed:", err);
  }

  // Always return 200 so a mail failure never blocks the user flow
  return NextResponse.json({ ok: true, notified: true });
}
