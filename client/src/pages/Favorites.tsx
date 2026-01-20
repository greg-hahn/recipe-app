import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, SortAsc, SortDesc, Calendar, Type } from 'lucide-react';
import { getAllFavorites, removeFavorite, clearAllFavorites, type FavoriteMeal } from '@/features/favorites/db';
import { MealCard } from '@/components/MealCard';
import { MealCardGridSkeleton } from '@/components/MealCardSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

type SortBy = 'date' | 'name';
type SortOrder = 'asc' | 'desc';

/**
 * Favorites Page
 * 
 * Displays all saved favorite recipes.
 * Features:
 * - Works completely offline (data from IndexedDB)
 * - Sort by date or name
 * - Remove individual favorites
 * - Clear all favorites (with confirmation)
 */
export function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { toast } = useToast();

  // Load favorites from IndexedDB
  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllFavorites(sortBy, sortOrder);
      setFavorites(data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load favorites. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortOrder, toast]);

  // Initial load
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Remove single favorite
  const handleRemoveFavorite = async (meal: FavoriteMeal) => {
    try {
      await removeFavorite(meal.idMeal);
      setFavorites((prev) => prev.filter((f) => f.idMeal !== meal.idMeal));
      
      toast({
        title: 'Removed from favorites',
        description: meal.strMeal,
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove favorite. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Clear all favorites
  const handleClearAll = async () => {
    try {
      await clearAllFavorites();
      setFavorites([]);
      
      toast({
        title: 'All favorites cleared',
        description: 'Your favorites list is now empty.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to clear favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear favorites. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Toggle sort order
  const toggleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Favorites
          </h1>
          <p className="text-muted-foreground mt-1">
            {favorites.length === 0
              ? 'No saved recipes yet'
              : `${favorites.length} saved recipe${favorites.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Sort buttons */}
            <div className="flex gap-1" role="group" aria-label="Sort options">
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSort('date')}
                aria-pressed={sortBy === 'date'}
              >
                <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
                Date
                {sortBy === 'date' && (
                  sortOrder === 'desc' 
                    ? <SortDesc className="h-3 w-3 ml-1" aria-hidden="true" />
                    : <SortAsc className="h-3 w-3 ml-1" aria-hidden="true" />
                )}
              </Button>
              <Button
                variant={sortBy === 'name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSort('name')}
                aria-pressed={sortBy === 'name'}
              >
                <Type className="h-4 w-4 mr-1" aria-hidden="true" />
                Name
                {sortBy === 'name' && (
                  sortOrder === 'desc' 
                    ? <SortDesc className="h-3 w-3 ml-1" aria-hidden="true" />
                    : <SortAsc className="h-3 w-3 ml-1" aria-hidden="true" />
                )}
              </Button>
            </div>

            {/* Clear all button with confirmation */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                  Clear All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear all favorites?</DialogTitle>
                  <DialogDescription>
                    This will permanently remove all {favorites.length} recipes from your favorites. 
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="destructive" onClick={handleClearAll}>
                      Yes, clear all
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </header>

      {/* Content */}
      <section aria-label="Favorite recipes">
        {isLoading ? (
          <MealCardGridSkeleton count={4} />
        ) : favorites.length === 0 ? (
          <EmptyState type="no-favorites" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((meal) => (
              <div key={meal.idMeal} className="relative">
                <MealCard
                  id={meal.idMeal}
                  title={meal.strMeal}
                  image={meal.strMealThumb}
                  category={meal.strCategory}
                  area={meal.strArea}
                  isFavorite={true}
                  onToggleFavorite={() => handleRemoveFavorite(meal)}
                />
                {/* Saved date badge */}
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2 text-xs"
                >
                  Saved {formatDate(meal.savedAt)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA for empty state */}
      {!isLoading && favorites.length === 0 && (
        <div className="text-center">
          <Link to="/">
            <Button size="lg">
              Browse Recipes
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
