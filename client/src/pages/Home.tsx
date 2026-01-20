import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchMeals, getCategories, getMealsByCategory, getMealById, type Meal, type MealSummary, type Category } from '@/lib/api';
import { MealCard } from '@/components/MealCard';
import { MealCardGridSkeleton } from '@/components/MealCardSkeleton';
import { CategoryChips } from '@/components/CategoryChips';
import { EmptyState } from '@/components/EmptyState';
import { isFavorite, toggleFavorite, getFavorite } from '@/features/favorites/db';
import { useToast } from '@/components/ui/use-toast';
import { cacheCategoriesForOffline, cacheCategoryMealsForOffline, cacheImages } from '@/lib/cache';

/**
 * Home Page
 * 
 * Main landing page with:
 * - Search functionality (via URL params)
 * - Category filtering
 * - Recipe grid with favorites
 */
export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // ----- Data Fetching -----
  
  // Fetch categories
  const { 
    data: categories = [], 
    isLoading: categoriesLoading 
  } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch meals based on search or category
  const { 
    data: meals = [], 
    isLoading: mealsLoading,
    error: mealsError,
    refetch: refetchMeals,
  } = useQuery({
    queryKey: ['meals', searchQuery, selectedCategory],
    queryFn: async () => {
      // If a category is selected, filter by category (takes priority)
      if (selectedCategory) {
        const summaries = await getMealsByCategory(selectedCategory);
        return summaries as (Meal | MealSummary)[];
      }
      
      // If there's a search query, search by name
      if (searchQuery) {
        return searchMeals(searchQuery);
      }
      
      // Default: show popular meals (search for common ingredients)
      return searchMeals('chicken');
    },
  });

  // ----- Offline Caching -----
  
  // Cache categories when loaded
  useEffect(() => {
    if (categories.length > 0) {
      cacheCategoriesForOffline(categories as Category[]).catch(console.warn);
    }
  }, [categories]);

  // Cache category meals and their images when loaded
  useEffect(() => {
    if (meals.length > 0 && selectedCategory) {
      // Cache the category filter results
      cacheCategoryMealsForOffline(selectedCategory, meals as MealSummary[]).catch(console.warn);
    } else if (meals.length > 0) {
      // Cache images for search results
      const imageUrls = meals.map((m) => m.strMealThumb).filter(Boolean);
      cacheImages(imageUrls).catch(console.warn);
    }
  }, [meals, selectedCategory]);

  // ----- Favorites Management -----
  
  // Load favorite IDs on mount
  useEffect(() => {
    const loadFavorites = async () => {
      const ids = new Set<string>();
      for (const meal of meals) {
        if (await isFavorite(meal.idMeal)) {
          ids.add(meal.idMeal);
        }
      }
      setFavoriteIds(ids);
    };
    
    if (meals.length > 0) {
      loadFavorites();
    }
  }, [meals]);

  // Toggle favorite handler
  const handleToggleFavorite = useCallback(async (meal: Meal | MealSummary) => {
    try {
      // For category-filtered meals, we only have summary data
      // We need to fetch full meal data before saving
      let fullMeal: Meal;
      
      if ('strInstructions' in meal) {
        fullMeal = meal as Meal;
      } else {
        // Check if we already have it in favorites
        const existing = await getFavorite(meal.idMeal);
        if (existing) {
          fullMeal = existing;
        } else {
          // Fetch full details
          const fetched = await getMealById(meal.idMeal);
          if (!fetched) {
            throw new Error('Failed to fetch meal details');
          }
          fullMeal = fetched;
        }
      }
      
      const isNowFavorite = await toggleFavorite(fullMeal);
      
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isNowFavorite) {
          next.add(meal.idMeal);
        } else {
          next.delete(meal.idMeal);
        }
        return next;
      });
      
      toast({
        title: isNowFavorite ? 'Added to favorites' : 'Removed from favorites',
        description: meal.strMeal,
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Handle category selection - clears search when a category is selected
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    // Clear search query when selecting a category
    if (category !== null && searchQuery) {
      setSearchParams({});
    }
  };

  // ----- Render -----
  
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {searchQuery 
            ? `Search results for "${searchQuery}"` 
            : selectedCategory 
              ? `${selectedCategory} Recipes`
              : 'Discover Recipes'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse delicious recipes from around the world
        </p>
      </header>

      {/* Category Filters */}
      <section aria-label="Category filters">
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
          isLoading={categoriesLoading}
        />
      </section>

      {/* Recipe Grid */}
      <section aria-label="Recipe list">
        {mealsLoading ? (
          <MealCardGridSkeleton count={8} />
        ) : mealsError ? (
          <EmptyState 
            type="error" 
            onRetry={() => refetchMeals()} 
          />
        ) : meals.length === 0 ? (
          <EmptyState type="no-results" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {meals.map((meal) => (
              <MealCard
                key={meal.idMeal}
                id={meal.idMeal}
                title={meal.strMeal}
                image={meal.strMealThumb}
                category={'strCategory' in meal ? meal.strCategory : undefined}
                area={'strArea' in meal ? meal.strArea : undefined}
                isFavorite={favoriteIds.has(meal.idMeal)}
                onToggleFavorite={() => handleToggleFavorite(meal)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
