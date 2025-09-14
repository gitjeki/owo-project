// types/next-auth.d.ts

// [1] Hapus 'DefaultSession' dan gunakan `import type` untuk kejelasan
import type { DefaultUser } from "next-auth";
// [2] Import 'JWT' tidak diperlukan saat melakukan augmentasi modul
// import { JWT } from "next-auth/jwt";

/**
 * Mendeklarasikan ulang modul JWT untuk menambahkan properti kustom.
 */
declare module "next-auth/jwt" {
  interface JWT {
    refreshToken?: string;
    accessToken?: string;
    accessTokenExpires?: number;
    error?: string;
    user?: DefaultUser & { id: string }; // 'DefaultUser' digunakan di sini
  }
}

/**
 * Mendeklarasikan ulang modul Session untuk menambahkan properti kustom.
 */
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user?: DefaultUser & {
      id: string; // 'DefaultUser' digunakan di sini juga
    };
  }
}