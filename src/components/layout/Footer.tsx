import Link from 'next/link';
import { ROUTE_CONFIG } from '@/lib/config';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-black py-8 mt-12 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo */}
          <div className="mb-4 md:mb-0">
            <Link href={ROUTE_CONFIG.HOME} className="text-xl font-bold text-red-600">
              FreeFlix
            </Link>
          </div>
          
          {/* Footer Links */}
          <nav className="flex gap-6 mb-4 md:mb-0" aria-label="Footer Navigation">
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
          </nav>
          
          {/* Copyright */}
          <div className="text-gray-400 text-sm">
            © {currentYear} FreeFlix. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 