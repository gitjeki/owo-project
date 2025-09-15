"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useSession, signIn } from "next-auth/react";
import * as cheerio from "cheerio";
import HisenseCookieInput from "@/components/HisenseCookieInput";
import Sidebar from "@/components/Sidebar";

const defaultEvaluationValues: Record<string, string> = {
  H: "Sesuai",
  I: "Sesuai",
  J: "Sesuai",
  K: "Sesuai",
  L: "Sesuai",
  N: "Sesuai",
  O: "Lengkap",
  Q: "Konsisten",
  R: "Sesuai",
  S: "Lengkap",
  T: "Ada",
  U: "Ya",
};

export interface DkmData {
  schoolInfo: { [key: string]: string };
  images: { [key: string]: string };
  processHistory: { tanggal: string; status: string; keterangan: string }[];
  q: string;
  npsn: string;
  iprop: string;
  ikab: string;
  ikec: string;
  iins: string;
  ijenjang: string;
  ibp: string;
  iss: string;
  isf: string;
  istt: string;
  itgl: string;
  itgla: string;
  itgle: string;
}

export interface SheetRow {
  rowIndex: number;
  rowData: (string | number)[];
  headerRow?: string[];
}

interface AppContextType {
  verifierName: string | null;
  pendingCount: number;
  dkmData: DkmData | null;
  isLoading: boolean;
  isFetchingDetails: boolean;
  error: string | null;
  isSubmitting: boolean;
  evaluationForm: Record<string, string>;
  setEvaluationForm: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  handleTerima: () => void;
  handleTolak: () => void;
  handleSkip: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [verifierName, setVerifierName] = useState<string | null>(null);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookieValid, setCookieValid] = useState(false);

  const [allPendingRows, setAllPendingRows] = useState<SheetRow[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [dkmData, setDkmData] = useState<DkmData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState<Record<string, string>>(
    defaultEvaluationValues
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleSkip = useCallback(async () => {
    if (allPendingRows.length === 0) return;
    if (allPendingRows.length === 1) {
      const currentRow = allPendingRows[0];
      try {
        await fetch("/api/sheets/batch-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "formatSkip",
            sheetId: process.env.NEXT_PUBLIC_SHEET_ID,
            rowIndex: currentRow.rowIndex,
          }),
        });
      } catch (error) {
        console.error("Gagal format baris skip terakhir:", error);
      }
      setAllPendingRows([]);
      return;
    }

    const currentRow = allPendingRows[currentRowIndex];

    try {
      await fetch("/api/sheets/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "formatSkip",
          sheetId: process.env.NEXT_PUBLIC_SHEET_ID,
          rowIndex: currentRow.rowIndex,
        }),
      });
    } catch (error) {
      console.error("Gagal format baris skip:", error);
    } finally {
      const newRows = allPendingRows.filter(
        (_, index) => index !== currentRowIndex
      );
      setAllPendingRows(newRows);
      if (currentRowIndex >= newRows.length && newRows.length > 0) {
        setCurrentRowIndex(0);
      }
    }
  }, [allPendingRows, currentRowIndex]);

  // Fungsi fetchDetailsForRow yang sudah di-upgrade
  const fetchDetailsForRow = useCallback(
    async (row: SheetRow) => {
      if (!row) return;
      setIsFetchingDetails(true);
      setDkmData(null);
      setError(null);
      try {
        const headerRow = row.headerRow;
        if (!headerRow) throw new Error("Header row tidak ditemukan.");
        const npsnCol = headerRow.indexOf("NPSN");
        const npsn = row.rowData[npsnCol];
        if (!npsn) throw new Error("NPSN tidak ditemukan di baris ini.");

        const cookie = localStorage.getItem("hisense_cookie");
        if (!cookie) throw new Error("Cookie Hisense tidak ditemukan.");

        const monitoringHtml = await (
          await fetch("/api/hisense", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: `r_monitoring.php?inpsn=${npsn}`,
              cookie,
            }),
          })
        ).text();
        const $ = cheerio.load(monitoringHtml);

        // === LOGIKA AUTO-SKIP DIMASUKKAN DI SINI ===
        const firstRow = $(
          "#main-content > div > div > div > div.table-container > div > table > tbody tr"
        ).first();
        const firstTdStyle = firstRow.find("td").first().attr("style");

        if (!firstTdStyle || !firstTdStyle.includes("color:green")) {
          console.log(`Auto-skipping NPSN: ${npsn} karena warna bukan hijau.`);
          handleSkip();
          setIsFetchingDetails(false);
          return;
        }

        const onClickAttribute = firstRow.attr("onclick");
        const urlMatch = onClickAttribute?.match(/window\.open\('([^']*)'/);
        const nextPath = urlMatch ? urlMatch[1] : null;
        if (!nextPath)
          throw new Error(
            "Gagal mengekstrak URL detail dari halaman monitoring."
          );

        const dkmHtml = await (
          await fetch("/api/hisense", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: nextPath, cookie }),
          })
        ).text();
        const $dkm = cheerio.load(dkmHtml);

        const schoolInfo: { [key: string]: string } = {};
        $dkm('.filter-section input[type="text"]').each((_, el) => {
          const label = $dkm(el)
            .prev("label")
            .text()
            .trim()
            .replace("Telp", "Telp PIC");
          const value = $dkm(el).val() as string;
          if (label) schoolInfo[label] = value;
        });
        const images: { [key: string]: string } = {};
        $dkm("#flush-collapseTwo img").each((_, el) => {
          const label = $dkm(el)
            .closest(".card")
            .find("label > b")
            .text()
            .trim();
          const src = $dkm(el).attr("src");
          if (label && src) images[label] = src;
        });
        const processHistory: {
          tanggal: string;
          status: string;
          keterangan: string;
        }[] = [];
        $dkm("#flush-collapseOne tbody tr").each((_, row) => {
          const columns = $dkm(row).find("td");
          processHistory.push({
            tanggal: $dkm(columns[0]).text().trim(),
            status: $dkm(columns[1]).text().trim(),
            keterangan: $dkm(columns[2]).text().trim(),
          });
        });

        const finalData: DkmData = {
          schoolInfo,
          images,
          processHistory,
          q: new URLSearchParams(nextPath).get("q") || "",
          npsn: schoolInfo["NPSN"] || "",
          iprop: new URLSearchParams(nextPath).get("iprop") || "",
          ikab: new URLSearchParams(nextPath).get("ikab") || "",
          ikec: new URLSearchParams(nextPath).get("ikec") || "",
          iins: new URLSearchParams(nextPath).get("iins") || "",
          ijenjang: new URLSearchParams(nextPath).get("ijenjang") || "",
          ibp: new URLSearchParams(nextPath).get("ibp") || "",
          iss: new URLSearchParams(nextPath).get("iss") || "",
          isf: new URLSearchParams(nextPath).get("isf") || "",
          istt: new URLSearchParams(nextPath).get("istt") || "",
          itgl: new URLSearchParams(nextPath).get("itgl") || "",
          itgla: new URLSearchParams(nextPath).get("itgla") || "",
          itgle: new URLSearchParams(nextPath).get("itgle") || "",
        };

        setDkmData(finalData);
        setEvaluationForm(defaultEvaluationValues);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("An unknown error occurred in fetchDetailsForRow.");
      } finally {
        setIsFetchingDetails(false);
      }
    },
    [handleSkip]
  ); // <-- Jangan lupa tambahin handleSkip di sini

  useEffect(() => {
    const isReadyToFetch =
      cookieValid && sessionStatus === "authenticated" && verifierName;
    if (!isReadyToFetch) {
      setIsLoading(false);
      return;
    }
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      setAllPendingRows([]);
      try {
        const res = await fetch("/api/sheets");
        if (!res.ok)
          throw new Error("Gagal mengambil data dari Google Sheets.");
        const data = await res.json();
        const allData: SheetRow[] = data.values;
        if (!allData || allData.length < 3) {
          setAllPendingRows([]);
          return;
        }

        const headerRow = allData[2].rowData as string[];
        const verifikatorCol = headerRow.indexOf("VERIFIKATOR");
        const statusCol = headerRow.indexOf("STATUS (DITERIMA/DITOLAK)");

        if (verifikatorCol === -1 || statusCol === -1) {
          throw new Error(
            "Kolom VERIFIKATOR atau STATUS tidak ditemukan di Sheet."
          );
        }

        const filtered = allData
          .slice(3)
          .filter(
            (item: SheetRow) =>
              item.rowData[verifikatorCol] === verifierName &&
              (!item.rowData[statusCol] ||
                String(item.rowData[statusCol]).trim() === "")
          );

        const rowsWithHeader = filtered.map((row: SheetRow) => ({
          ...row,
          headerRow,
        }));
        setAllPendingRows(rowsWithHeader);
        setCurrentRowIndex(0);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("An unknown error occurred in fetchInitialData.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [cookieValid, sessionStatus, verifierName]);

  useEffect(() => {
    if (allPendingRows.length > 0 && currentRowIndex < allPendingRows.length) {
      const currentRow = allPendingRows[currentRowIndex];
      fetchDetailsForRow(currentRow);
    } else if (allPendingRows.length === 0 && !isLoading) {
      setDkmData(null);
    }
  }, [currentRowIndex, allPendingRows, fetchDetailsForRow, isLoading]);

  const updateSheetAndProceed = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (allPendingRows.length === 0)
        throw new Error("Tidak ada data untuk diupdate.");
      const currentRow = allPendingRows[currentRowIndex];
      const allUpdates = { ...evaluationForm };

      const res = await fetch("/api/sheets/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          sheetId: process.env.NEXT_PUBLIC_SHEET_ID,
          rowIndex: currentRow.rowIndex,
          updates: allUpdates,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || "Gagal batch update sheet.");
      }

      const newRows = allPendingRows.filter(
        (_, index) => index !== currentRowIndex
      );
      setAllPendingRows(newRows);

      if (currentRowIndex >= newRows.length && newRows.length > 0) {
        setCurrentRowIndex(0);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred in updateSheetAndProceed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTerima = () => updateSheetAndProceed();
  const handleTolak = () => {
    const alasan = prompt(
      "Masukkan alasan penolakan (akan ditulis di kolom KETERANGAN):"
    );
    if (alasan) {
      updateSheetAndProceed();
    }
  };

  useEffect(() => {
    const savedCookie = localStorage.getItem("hisense_cookie");
    const savedName = localStorage.getItem("nama");
    if (savedCookie && savedName) {
      setCookieValid(true);
      setVerifierName(savedName);
      setShowCookieModal(false);
    } else {
      setShowCookieModal(true);
    }
  }, []);

  const handleCookieSuccess = () => {
    const savedName = localStorage.getItem("nama");
    setVerifierName(savedName);
    setCookieValid(true);
    setShowCookieModal(false);
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 text-gray-800">
        <p>Loading session...</p>
      </div>
    );
  }
  if (showCookieModal) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-96 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            Masukkan PHPSESSID
          </h2>
          <HisenseCookieInput onSuccess={handleCookieSuccess} />
          <p className="text-sm text-gray-600">
            Cookie harus valid untuk melanjutkan.
          </p>
        </div>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 bg-gray-100 text-gray-800">
        <p className="text-lg font-semibold">
          Selamat Datang di Aplikasi Verifier
        </p>
        <p>Silakan login dengan Google untuk melanjutkan.</p>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Login Google
        </button>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        verifierName,
        pendingCount: allPendingRows.length,
        dkmData,
        isLoading,
        isFetchingDetails,
        error,
        isSubmitting,
        evaluationForm,
        setEvaluationForm,
        handleTerima,
        handleTolak,
        handleSkip,
        isSidebarOpen,
        toggleSidebar,
      }}>
      <div className="flex h-screen bg-gray-200">
        <Sidebar />
        <main className="relative flex-grow p-6 overflow-y-auto bg-gray-100 text-gray-900">
          {children}
        </main>
      </div>
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="md:hidden fixed inset-0 bg-black/50 z-20"
        />
      )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined)
    throw new Error("useAppContext must be used within an AppProvider");
  return context;
}
