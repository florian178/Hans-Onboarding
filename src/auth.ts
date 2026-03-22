import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "onboarding@resend.dev",
      sendVerificationRequest: async (params) => {
        const { identifier, url, provider } = params;
        console.log(`\n\n[Magic Link generated]:\nTo: ${identifier}\nURL: ${url}\n\n`);
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${provider.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: provider.from,
              to: identifier,
              subject: "Dein Magic Link - Onboarding",
              html: `<p>Klicke <a href="${url}">hier</a>, um dich einzuloggen.</p>`,
            }),
          });
          if (!res.ok) {
            console.error("[Resend API Error]:", await res.text());
          }
        } catch (error) {
          console.error("Failed to send email via Resend", error);
        }
      }
    }),
    Credentials({
      name: "Entwickler-Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (process.env.NODE_ENV !== "development") return null;
        if (credentials.password !== "hans123") return null;
        
        console.log(`[Authorize] Attempting login for: ${credentials.email}`);
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { onboardingStatus: true }
        });

        if (!user) {
          console.log(`[Authorize] User not found: ${credentials.email}`);
          return null;
        }
        
        return user;
      }
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
})
