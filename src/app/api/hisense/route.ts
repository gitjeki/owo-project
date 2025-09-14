import { NextResponse } from "next/server";

interface HisenseRequestBody {
  path: string;
  cookie: string;
}

export async function POST(req: Request) {
  try {
    const { path, cookie }: HisenseRequestBody = await req.json();

    if (!cookie) {
      return NextResponse.json(
        { error: "Cookie PHPSESSID diperlukan" },
        { status: 400 }
      );
    }
    
    const baseUrl = process.env.HISENSE_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "HISENSE_BASE_URL not set" },
        { status: 500 }
      );
    }

    const hisenseRes = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: { Cookie: `PHPSESSID=${cookie}` },
    });

    const body = await hisenseRes.text();
    
    const contentType = hisenseRes.headers.get("content-type") || "text/html";

    return new Response(body, {
      status: hisenseRes.status,
      headers: { "Content-Type": contentType },
    });

  } catch (err: unknown) {
    let errorMessage = "Internal server error";

    if (err instanceof Error) {
      errorMessage = err.message;
    }

    console.error("Hisense API proxy error:", errorMessage);
    
    return new Response(errorMessage, { status: 500 });
  }
}