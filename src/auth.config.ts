import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = nextUrl.pathname.startsWith('/api/auth');
      const isPublicRoute = 
        nextUrl.pathname === '/' || 
        nextUrl.pathname === '/login' || 
        nextUrl.pathname === '/reset-password';
      
      if (isAuthRoute) return true;

      if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      // Admin route protection
      if (isLoggedIn && nextUrl.pathname.startsWith('/admin')) {
        const role = (auth.user as { role?: string })?.role;
        if (role !== 'ADMIN') {
          return Response.redirect(new URL('/onboarding', nextUrl));
        }
      }

      if (isLoggedIn && isPublicRoute) {
        const role = (auth.user as { role?: string })?.role;
        const status = (auth.user as { onboardingStatus?: { status?: string } })?.onboardingStatus?.status;
        
        if (role === 'ADMIN') {
          return Response.redirect(new URL('/admin', nextUrl));
        } else if (status === 'COMPLETED') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        } else {
          return Response.redirect(new URL('/onboarding', nextUrl));
        }
      }

      return true;
    },
    async session({ session, user, token }) {
      if (session.user) {
        if (user?.id) {
           session.user.id = user.id;
        } else if (token?.sub) {
           session.user.id = token.sub;
        }
        
        if (user && (user as { role?: string }).role) {
          (session.user as { role?: string }).role = (user as { role?: string }).role;
        } else if (token?.role) {
          (session.user as { role?: string }).role = token.role as string;
        }

        if (token?.onboardingStatus) {
          (session.user as { onboardingStatus?: { status: string } }).onboardingStatus = { status: token.onboardingStatus as string };
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.onboardingStatus = (user as { onboardingStatus?: { status?: string } }).onboardingStatus?.status;
      }
      if (token.email === "admin@hansimclub.de") {
        token.role = "ADMIN";
      }
      return token;
    }
  },
} satisfies NextAuthConfig
