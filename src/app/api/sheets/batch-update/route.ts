import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { NextResponse } from "next/server";

// [1] REKOMENDASI: Definisikan tipe untuk body request agar API lebih robust
interface BatchUpdateRequestBody {
  sheetId: string;
  rowIndex: number;
  updates: Record<string, string | number>; // Objek dengan key string dan value string/number
}

export async function POST(req: Request) {
  // [2] Gunakan tipe Session yang sudah kita augment di file next-auth.d.ts
  const session: Session | null = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gunakan tipe yang sudah didefinisikan untuk request body
  const { sheetId, rowIndex, updates }: BatchUpdateRequestBody = await req.json();
  
  if (!sheetId || !rowIndex || !updates) {
    return NextResponse.json(
      { error: "Parameter tidak lengkap (sheetId, rowIndex, updates)" },
      { status: 400 }
    );
  }
  
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const sheets = google.sheets({ version: "v4", auth });

    // Ubah objek updates menjadi format yang dibutuhkan batchUpdate
    const data = Object.entries(updates).map(([column, value]) => ({
      range: `'Lembar Kerja'!${column}${rowIndex}`,
      values: [[value]],
    }));

    const response = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: data,
      },
    });

    return NextResponse.json({ success: true, data: response.data });

  } catch (error: unknown) { // [3] Ganti `any` dengan `unknown` untuk penanganan error yang aman
    let errorMessage = "Terjadi kesalahan saat mengupdate Google Sheets.";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error("Google Sheets API Batch Update Error:", error);
    
    return NextResponse.json(
      { error: "Gagal mengupdate Google Sheets.", details: errorMessage },
      { status: 500 }
    );
  }
}