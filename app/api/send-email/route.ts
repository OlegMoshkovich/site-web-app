import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Missing required environment variable: RESEND_API_KEY" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.text();

    if (!response.ok) {
      return NextResponse.json({ error: responseBody }, { status: response.status });
    }

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected email error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
