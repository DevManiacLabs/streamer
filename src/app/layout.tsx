import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { classNames } from "@/lib/utils";
import { Header, Footer } from "@/components/layout";

// Load Inter font with specific weights
const inter = Inter({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  display: 'swap',
});

// Application metadata
export const metadata: Metadata = {
  title: "FreeFlix - Watch Movies and TV Shows Online",
  description: "Watch your favorite movies and TV shows online for free",
  keywords: "movies, tv shows, streaming, free, watch online",
  applicationName: "FreeFlix",
  robots: "index, follow",
  authors: [{ name: "FreeFlix Team" }],
};

/**
 * Root layout component that wraps the entire application
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className="scroll-smooth"
    >
      <body className={classNames(
        inter.className,
        "min-h-screen bg-black text-white flex flex-col"
      )}>
        <Providers>
          <Header />
          <main className="pt-16 flex-grow">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
