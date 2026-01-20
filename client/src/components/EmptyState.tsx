import { SearchX, ServerCrash, WifiOff, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateType = 'no-results' | 'error' | 'offline' | 'no-favorites';

interface EmptyStateProps {
  type: EmptyStateType;
  message?: string;
  onRetry?: () => void;
}

const stateConfig = {
  'no-results': {
    icon: SearchX,
    title: 'No recipes found',
    description: 'Try adjusting your search or browse different categories.',
  },
  'error': {
    icon: ServerCrash,
    title: 'Something went wrong',
    description: 'We couldn\'t load the recipes. Please try again.',
  },
  'offline': {
    icon: WifiOff,
    title: 'You\'re offline',
    description: 'Connect to the internet to browse recipes, or view your saved favorites.',
  },
  'no-favorites': {
    icon: UtensilsCrossed,
    title: 'No favorites yet',
    description: 'Start exploring recipes and save your favorites to access them anytime, even offline!',
  },
};

/**
 * Empty State Component
 * 
 * Displays a friendly message when there's no content to show.
 * Used for search results, errors, offline states, and empty favorites.
 */
export function EmptyState({ type, message, onRetry }: EmptyStateProps) {
  const config = stateConfig[type];
  const Icon = config.icon;

  return (
    <div 
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      
      <h2 className="text-xl font-semibold mb-2">
        {config.title}
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-6">
        {message || config.description}
      </p>
      
      {onRetry && (
        <Button onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
