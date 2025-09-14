"use client";

import { useAppContext } from "@/context/AppProvider";
import DkmDetails from "@/components/DkmDetails";

export default function Home() {
  const { dkmData, isLoading, error, pendingCount, verifierName } = useAppContext(); 

  const renderContent = () => {
    if (isLoading) return <p>Mencari data spreadsheet untuk <b>{verifierName}</b>...</p>;
    if (error) return <p className="text-red-500 font-bold bg-red-100 p-4 rounded-lg">Error: {error}</p>;
    
    if (pendingCount === 0 && !isLoading) {
      return (
        <div className="text-center bg-white rounded-lg shadow-md p-6">
          <p className="text-2xl text-green-600 font-bold">🎉</p>
          <p className="mt-2 font-semibold">Semua pekerjaan untuk <b>{verifierName}</b> sudah selesai!</p>
        </div>
      );
    }
    
    if (pendingCount !== null && pendingCount > 0 && !dkmData) {
        return <p className="animate-pulse">Memuat detail pekerjaan berikutnya...</p>
    }

    if (dkmData) {
        return <DkmDetails data={dkmData} />
    }
    
    return null;
  };

  return (
    <div className="flex flex-col w-full h-full p-4 bg-gray-50">
      <header className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-800">
          Detail Pekerjaan
        </h1>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold text-lg text-gray-800">{verifierName}</p>
            <p className="text-xs text-gray-500">Verifier Aktif</p>
          </div>
          {pendingCount !== null && (
            <div className="bg-blue-600 rounded-lg p-3 text-white text-center shadow-lg">
              <p className="text-3xl font-bold leading-none">{pendingCount}</p>
              <p className="text-xs font-semibold tracking-wider">DATA LAGI</p>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow p-6 bg-white rounded-lg shadow-md">
        {renderContent()}
      </main>
    </div>
  );
}