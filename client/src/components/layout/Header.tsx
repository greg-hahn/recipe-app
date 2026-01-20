import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import { Search, Heart, ChefHat, WifiOff, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isOnline: boolean;
}

/**
 * Main Header Component
 * 
 * Contains:
 * - App logo and title
 * - Search input
 * - Navigation links
 * - Theme toggle
 * - Online status indicator
 */
export function Header({ isOnline }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isOnFavoritesPage = location.pathname === '/favorites';

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo and Title */}
          <Link 
            to="/" 
            className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity"
            aria-label="Recipe App Home"
          >
            <ChefHat className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">Recipe App</span>
          </Link>

          {/* Search Form */}
          <form 
            onSubmit={handleSearch} 
            className="flex-1 max-w-md"
            role="search"
          >
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" 
                aria-hidden="true" 
              />
              <Input
                type="search"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
                aria-label="Search recipes"
              />
            </div>
          </form>

          {/* Navigation */}
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            {/* Offline Indicator */}
            {!isOnline && (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" aria-hidden="true" />
                <span className="hidden sm:inline">Offline</span>
              </Badge>
            )}

            {/* Favorites/Home Link */}
            <Button variant="ghost" size="icon" asChild>
              <Link 
                to={isOnFavoritesPage ? "/" : "/favorites"} 
                aria-label={isOnFavoritesPage ? "Go to home" : "View favorites"}
                title={isOnFavoritesPage ? "Home" : "Favorites"}
              >
                {isOnFavoritesPage ? (
                  <Home className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Heart className="h-5 w-5" aria-hidden="true" />
                )}
              </Link>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
