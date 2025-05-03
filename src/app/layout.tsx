import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { UserMenu } from "@/components/auth/UserMenu";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "FreeFlix - Watch Movies and TV Shows Online",
  description: "Watch your favorite movies and TV shows online for free",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-black text-white`}>
        <Providers>
          <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold text-red-600">
                  FreeFlix
                </Link>
                <div className="hidden md:flex items-center space-x-6">
                  <Link
                    href="/"
                    className="text-sm font-medium text-gray-200 hover:text-white transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    href="/movies"
                    className="text-sm font-medium text-gray-200 hover:text-white transition-colors"
                  >
                    Movies
                  </Link>
                  <Link
                    href="/tv"
                    className="text-sm font-medium text-gray-200 hover:text-white transition-colors"
                  >
                    TV Shows
                  </Link>
                  <Link
                    href="/latest"
                    className="text-sm font-medium text-gray-200 hover:text-white transition-colors"
                  >
                    Latest
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <SearchBar />
                  <UserMenu />
                  <button className="md:hidden text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </header>
          <main className="pt-16">
            {children}
          </main>
          <footer className="bg-black py-8 mt-12 border-t border-gray-800">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <Link href="/" className="text-xl font-bold text-red-600">
                    FreeFlix
                  </Link>
                </div>
                <div className="flex gap-6 mb-4 md:mb-0">
                  <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                    About
                  </Link>
                  <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Terms
                  </Link>
                  <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Privacy
                  </Link>
                  <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Contact
                  </Link>
                </div>
                <div className="text-gray-400 text-sm">
                  © {new Date().getFullYear()} FreeFlix. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
