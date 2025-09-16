// ./src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt"; // Kita masih butuh JWT untuk anotasi

// Interface kustom dihapus dari sini karena sudah didefinisikan di next-auth.d.ts

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = "https://oauth2.googleapis.com/token?" + new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken!,
    });

    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) throw refreshedTokens;

    console.log("Access token berhasil di-refresh:", refreshedTokens.access_token);

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    // ... (Provider Anda tidak berubah)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    // TypeScript sekarang akan otomatis menggunakan tipe dari next-auth.d.ts
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at! * 1000,
          refreshToken: account.refresh_token,
          user: user,
        };
      }

      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      console.log("Access token kadaluarsa, mencoba me-refresh...");
      return refreshAccessToken(token);
    },
    
    // Tipe untuk session dan token sekarang otomatis benar
    async session({ session, token }) {
      // Sekarang aman untuk melakukan ini karena tipe global sudah diperbarui
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };