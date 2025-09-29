import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { NextResponse } from "next/server";

// [1] Definisikan tipe sesi yang lebih spesifik
// Ini memberitahu TypeScript bahwa objek sesi kita akan memiliki properti `accessToken`.
interface CustomSession extends Session {
  accessToken?: string;
}

export async function GET() {
  // Gunakan tipe CustomSession yang baru kita buat. `getServerSession` bisa mengembalikan null.
  const session: CustomSession | null = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetId = process.env.SHEET_ID;
  if (!sheetId) {
    return NextResponse.json(
      { error: "SHEET_ID tidak dikonfigurasi." },
      { status: 500 }
    );
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "'Lembar Kerja'!A:Y", // Pastikan nama sheet benar
    });

    const values = response.data.values || [];

    // ===== PERUBAHAN PENTING: Sertakan nomor baris asli =====
    const dataWithRowIndex = values.map((row, index) => ({
      rowIndex: index + 1, // Biasanya data dimulai dari baris ke-2 (setelah header)
      rowData: row,
    }));

    return NextResponse.json({ values: dataWithRowIndex });

  } catch (error: unknown) { // [2] Ganti `any` dengan `unknown` untuk penanganan error yang lebih aman
    let errorMessage = "Terjadi kesalahan yang tidak diketahui.";
    
    // Lakukan pemeriksaan tipe sebelum mengakses properti .message
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    console.error("Google Sheets API Error:", errorMessage);
    return NextResponse.json(
      {
        error: "Gagal mengambil data dari Google Sheets.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}