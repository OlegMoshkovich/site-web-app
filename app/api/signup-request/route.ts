import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const signupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  redirectPath: z.string().startsWith("/"),
});

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function sendAdminNotificationEmail(params: {
  adminEmail: string;
  fromEmail: string;
  resendApiKey: string;
  userEmail: string;
  actionLink: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.fromEmail,
      to: params.adminEmail,
      subject: `New signup confirmation link for ${params.userEmail}`,
      text: [
        "A new user signed up and is waiting for your personalized invitation.",
        "",
        `User email: ${params.userEmail}`,
        "",
        "Forward this confirmation link to the user when you're ready:",
        params.actionLink,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send admin notification email: ${errorText}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = signupRequestSchema.parse(await request.json());
    const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const adminEmail = getRequiredEnv("ADMIN_NOTIFICATION_EMAIL");
    const resendApiKey = getRequiredEnv("RESEND_API_KEY");
    const resendFromEmail = getRequiredEnv("RESEND_FROM_EMAIL");
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: body.email,
      password: body.password,
      options: {
        redirectTo: `${origin}${body.redirectPath}`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const actionLink = data.properties?.action_link;

    if (!actionLink) {
      return NextResponse.json(
        { error: "Supabase did not return a confirmation link." },
        { status: 500 },
      );
    }

    await sendAdminNotificationEmail({
      adminEmail,
      fromEmail: resendFromEmail,
      resendApiKey,
      userEmail: body.email,
      actionLink,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid signup request.", details: error.flatten() },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected signup error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
