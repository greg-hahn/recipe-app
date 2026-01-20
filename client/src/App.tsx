import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Home } from '@/pages/Home';
import { Details } from '@/pages/Details';
import { Favorites } from '@/pages/Favorites';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/components/ui/use-toast';

/**
 * Main App Component
 * 
 * Sets up routing and global layout including:
 * - Skip link for accessibility
 * - Header with navigation
 * - Main content area with routes
 * - Offline status detection
 */
function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Listen for online/offline status changes
  useEffect(() => {
    const handleConnectionChange = (event: CustomEvent<{ online: boolean }>) => {
      const online = event.detail.online;
      setIsOnline(online);
      
      toast({
        title: online ? 'Back Online' : 'You\'re Offline',
        description: online 
          ? 'Your connection has been restored.' 
          : 'Some features may be limited. Your favorites are still available.',
        variant: online ? 'default' : 'destructive',
        duration: 4000,
      });
    };

    window.addEventListener('connection-change', handleConnectionChange as EventListener);
    
    return () => {
      window.removeEventListener('connection-change', handleConnectionChange as EventListener);
    };
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link for keyboard accessibility */}
      <a 
        href="#main-content" 
        className="skip-link"
      >
        Skip to main content
      </a>
      
      {/* Header with navigation and search */}
      <Header isOnline={isOnline} />
      
      {/* Main content area */}
      <main 
        id="main-content" 
        className="flex-1 container mx-auto px-4 py-6"
        role="main"
        aria-label="Main content"
      >
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipe/:id" element={<Details />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </ErrorBoundary>
      </main>
      
      {/* Footer */}
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <p>
          Powered by{' '}
          <a 
            href="https://www.themealdb.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-foreground focus:text-foreground"
          >
            TheMealDB
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
