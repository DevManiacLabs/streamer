import NextAuth from "next-auth";
import { authOptions } from "./auth";

// Create the handler and export it
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 