"use client";

import { useState } from "react";
import HisenseCookieInput from "@/components/HisenseCookieInput";

export default function Home() {
  const [id, setId] = useState<number>(1);
  const [alasan, setAlasan] = useState("");

  const handleUpdate = async (status: "Terima" | "Tolak") => {
    const payload = { id, status, alasan: status === "Tolak" ? alasan : undefined };

    const res = await fetch("/api/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": localStorage.getItem("auth_token") || "",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.success) {
      alert(`Row ${id} berhasil diupdate!`);
      setAlasan("");
    } else {
      alert("Gagal update: " + data.error);
    }
  };

  const testHisense = async () => {
    const res = await fetch("/api/hisense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "/status.php",
        options: { method: "GET" },
        cookie: localStorage.getItem("hisense_cookie") || "",
      }),
    });
    const data = await res.json();
    alert(JSON.stringify(data));
  };

  return (
    <main className="flex flex-col items-center p-8 gap-6">
      <h1 className="text-2xl font-bold">Approval & Hisense Control</h1>

      <HisenseCookieInput />

      <div className="flex flex-col gap-2">
        <label className="flex gap-2 items-center">
          <span>ID Row:</span>
          <input
            type="number"
            value={id}
            onChange={(e) => setId(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          />
        </label>

        <textarea
          placeholder="Alasan (isi kalau Tolak)"
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          className="border w-64 h-24 p-2 rounded"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleUpdate("Terima")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Terima
        </button>
        <button
          onClick={() => handleUpdate("Tolak")}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Tolak
        </button>
      </div>

      <button
        onClick={testHisense}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        Tes Hisense
      </button>
    </main>
  );
}
