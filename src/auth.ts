import NextAuth from "next-auth"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import crypto from "crypto"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      name: "Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 1. Static Master-Admin Check
        if (
          email === "admin@hansimclub.de" && 
          password === "HansAdmin2026!"
        ) {
          console.log(`[Authorize] Admin login successful`);
          let user = await prisma.user.findUnique({
            where: { email },
            include: { onboardingStatus: true }
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: "Administrator",
                role: "ADMIN",
                onboardingStatus: { create: { status: "COMPLETED" } }
              },
              include: { onboardingStatus: true }
            });
          }
          return user;
        }

        // 2. Employee Database Check
        const user = await prisma.user.findUnique({
          where: { email },
          include: { onboardingStatus: true }
        });

        if (user && user.password) {
          const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
          if (hashedPassword === user.password) {
            return user;
          }
        }
        
        console.log(`[Authorize] Invalid login attempt for: ${email}`);
        return null;
      }
    }),
  ],
  session: { strategy: "jwt" },
})
