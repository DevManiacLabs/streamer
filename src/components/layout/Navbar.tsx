import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl md:text-2xl">FreeFlix</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm">
          <Link href="/" className="transition-colors hover:text-foreground/80">
            Home
          </Link>
          <Link href="/movies" className="transition-colors hover:text-foreground/80">
            Movies
          </Link>
          <Link href="/tv" className="transition-colors hover:text-foreground/80">
            TV Shows
          </Link>
          <Link href="/latest" className="transition-colors hover:text-foreground/80">
            Latest
          </Link>
          <Link href="/watch-history" className="transition-colors hover:text-foreground/80">
            Watch History
          </Link>
        </nav>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="search"
              placeholder="Search..."
              className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Search"
            >
              🔍
            </button>
          </form>
          
          {/* Mobile menu button - would implement a proper mobile menu in a real app */}
          <button className="md:hidden" aria-label="Menu">
            ≡
          </button>
        </div>
      </div>
    </header>
  );
} 