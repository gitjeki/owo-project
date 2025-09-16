import * as cheerio from "cheerio";

export async function validateHisenseCookie(cookie: string): Promise<string | null> {
  try {
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
  } catch {
    return null;
  }
}