import { NextResponse, type NextRequest } from "next/server"; // [2] Import NextRequest

interface Ptk {
  ptk_terdaftar_id: string;
  ptk_id: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string;
  nik: string;
  nuptk: string | null;
  nip: string | null;
  nrg: string | null;
  kepegawaiian: string;
  jenis_ptk: string;
  jabatan_ptk: string;
  nomor_surat_tugas: string;
  tanggal_surat_tugas: string;
  tmt_tugas: string;
  ptk_induk: 'Ya' | 'Tidak'
  last_update: string;
}

interface SchoolData {
  id: string;
  name: string;
  address: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kepalaSekolah: string;
  ptk: Ptk[];
}

type Params = { npsn: string };

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { npsn } = await context.params;

  if (!npsn) {
    return NextResponse.json({ error: "NPSN diperlukan" }, { status: 400 });
  }

  try {
    const apiUrl = `https://wowo.up.railway.app/?q=${npsn}`;
    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      throw new Error(
        `Gagal mengambil data dari API eksternal. Status: ${apiResponse.status}`
      );
    }
    
    const data: SchoolData = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error: unknown) {
    let errorMessage = "Terjadi kesalahan pada server.";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    console.error("Error fetching school data:", error);
    
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}