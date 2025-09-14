"use client";

import { useState, useEffect } from "react";
import * as cheerio from "cheerio";

export default function HisenseCookieInput() {
  const [cookie, setCookie] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("hisense_cookie");
    if (saved) setCookie(saved);
  }, []);

  const validateCookie = async (cookie: string) => {
    try {
      setLoading(true);

      const res = await fetch("/api/hisense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "index.php",
          cookie,
        }),
      });

      const html = await res.text();
      const $ = cheerio.load(html as string);

      const buttonText = $("button.dropdown-toggle").text().trim();

      return buttonText || null;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const buttonValue = await validateCookie(cookie);

    if (!buttonValue) {
      alert("Cookie tidak valid atau button tidak ditemukan!");
      return;
    }

    localStorage.setItem("hisense_cookie", cookie);
    localStorage.setItem("nama", buttonValue as string);

    alert(`PHPSESSID valid & disimpan!\nnama: ${buttonValue}`);
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={cookie}
        onChange={(e) => setCookie(e.target.value)}
        placeholder="Masukkan PHPSESSID"
        className="border px-2 py-1 rounded w-64"
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Mengecek..." : "Simpan"}
      </button>
    </div>
  );
}
