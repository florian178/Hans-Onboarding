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
      name: "Admin-Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Secure Admin Login
        if (
          credentials.email === "admin@hansimclub.de" && 
          credentials.password === "HansAdmin2026!"
        ) {
          console.log(`[Authorize] Admin login successful`);
          
          let user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: { onboardingStatus: true }
          });

          if (!user) {
            console.log(`[Authorize] Creating initial Admin user`);
            user = await prisma.user.create({
              data: {
                email: "admin@hansimclub.de",
                name: "Administrator",
                role: "ADMIN",
                onboardingStatus: { create: { status: "COMPLETED" } }
              },
              include: { onboardingStatus: true }
            })
          }
          
          return user;
        }
        
        console.log(`[Authorize] Invalid login attempt for: ${credentials.email}`);
        return null;
      }
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
})
