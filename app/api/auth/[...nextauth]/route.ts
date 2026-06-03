// Path: app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "School Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Ask Supabase for the user with this email
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        // 2. If no user exists, reject login
        if (error || !user) {
          console.error("Login failed: User not found");
          return null;
        }

        // 3. Check password (NOTE: In a real production app, use bcrypt here!)
        // For our setup, we are checking against the "principal123" text we seeded.
        if (user.password !== credentials.password) {
          console.error("Login failed: Incorrect password");
          return null;
        }

        // 4. Success! Give NextAuth the user data
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role // We pass the role so your dashboard knows who is logging in
        };
      }
    })
  ],
  callbacks: {
    // This attaches the user's role (admin, principal, teacher) to their secure token
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin/login', // Send them to your custom login page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };