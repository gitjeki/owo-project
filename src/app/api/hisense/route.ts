import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { path, options, cookie } = await req.json();

    if (!cookie) {
      return NextResponse.json({ error: "Cookie PHPSESSID diperlukan" }, { status: 400 });
    }

    const baseUrl = process.env.HISENSE_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: "HISENSE_BASE_URL not set" }, { status: 500 });
    }

    const hisenseRes = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        ...(options?.headers || {}),
        Cookie: `PHPSESSID=${cookie}`,
      },
    });

    const body = await hisenseRes.text();

    return new Response(body, {
      status: hisenseRes.status,
      headers: { "Content-Type": hisenseRes.headers.get("content-type") || "text/html" },
    });
  } catch (err: any) {
    return new Response(err.message || "Internal error", { status: 500 });
  }
}
