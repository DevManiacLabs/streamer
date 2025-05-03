import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-10">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:items-start md:gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">FreeFlix</span>
          </Link>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} FreeFlix. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 sm:gap-6">
            <Link href="/about" className="text-sm underline-offset-4 hover:underline">
              About
            </Link>
            <Link href="/terms" className="text-sm underline-offset-4 hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm underline-offset-4 hover:underline">
              Privacy
            </Link>
            <Link href="/contact" className="text-sm underline-offset-4 hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
} 