import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import fs from 'fs';
import path from 'path';

// Define the user type
interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
}

// In-memory storage for development mode
const DEV_USERS_FILE = path.join(process.cwd(), 'dev-users.json');

// Function to read users from the JSON file
const readUsers = (): User[] => {
  try {
    if (fs.existsSync(DEV_USERS_FILE)) {
      const data = fs.readFileSync(DEV_USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading users file:', err);
  }
  return [];
};

// Configure NextAuth options
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // In development mode, create a mock user for testing
          if (process.env.NODE_ENV === "development" && 
              credentials.email === "test@example.com" && 
              credentials.password === "password") {
            return {
              id: "test-user-id",
              email: "test@example.com",
              name: "Test User"
            };
          }

          // In development mode, use local file storage
          if (process.env.NODE_ENV === "development") {
            const users = readUsers();
            const user = users.find(u => u.email === credentials.email);
            
            if (!user) {
              console.log("User not found");
              return null;
            }

            // Compare password with bcrypt
            const passwordMatch = await bcrypt.compare(
              credentials.password,
              user.password_hash
            );
            
            if (!passwordMatch) {
              console.log("Password doesn't match");
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name || undefined
            };
          }

          // For production, you would use Supabase or another DB
          console.log("Production auth not configured");
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || "";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login", // Error code passed in query string as ?error=
    verifyRequest: "/login", // Used for check email message
    newUser: "/profile", // If set, new users will be directed here on first sign in
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 