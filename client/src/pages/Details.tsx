import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, ExternalLink, Clock, Users } from 'lucide-react';
import { getMealById, extractIngredients, getYouTubeId, type Meal } from '@/lib/api';
import { isFavorite, toggleFavorite, getFavorite } from '@/features/favorites/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailsSkeleton } from '@/components/DetailsSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { cacheMealForOffline } from '@/lib/cache';

/**
 * Recipe Details Page
 * 
 * Displays full recipe information including:
 * - Image, title, category, area
 * - Ingredients list
 * - Cooking instructions
 * - YouTube video (if available)
 * - Tags
 * - Favorite toggle
 */
export function Details() {
  const { id } = useParams<{ id: string }>();
  const [isFav, setIsFav] = useState(false);
  const { toast } = useToast();

  // Fetch meal details
  const { 
    data: meal, 
    isLoading, 
    error,
    refetch,
  } = useQuery({
    queryKey: ['meal', id],
    queryFn: async () => {
      if (!id) return null;
      
      // First try to get from favorites (works offline)
      const favorite = await getFavorite(id);
      if (favorite) {
        return favorite;
      }
      
      // Otherwise fetch from API
      return getMealById(id);
    },
    enabled: !!id,
  });

  // Check favorite status
  useEffect(() => {
    const checkFavorite = async () => {
      if (id) {
        const favorite = await isFavorite(id);
        setIsFav(favorite);
      }
    };
    checkFavorite();
  }, [id]);

  // Cache the meal for offline access when viewed
  useEffect(() => {
    if (meal) {
      // Cache the meal image and API response in the background
      cacheMealForOffline(meal).catch(console.warn);
    }
  }, [meal]);

  // Toggle favorite handler
  const handleToggleFavorite = async () => {
    if (!meal) return;
    
    try {
      const isNowFavorite = await toggleFavorite(meal);
      setIsFav(isNowFavorite);
      
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
  };

  // Loading state
  if (isLoading) {
    return <DetailsSkeleton />;
  }

  // Error or not found state
  if (error || !meal) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to recipes
          </Button>
        </Link>
        <EmptyState 
          type="error" 
          message="We couldn't find this recipe. It may have been removed or the link is incorrect."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Extract ingredients
  const ingredients = extractIngredients(meal);
  
  // Parse tags
  const tags = meal.strTags ? meal.strTags.split(',').map(t => t.trim()).filter(Boolean) : [];
  
  // Get YouTube video ID
  const youtubeId = getYouTubeId(meal.strYoutube);

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link to="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to recipes
        </Button>
      </Link>

      {/* Recipe Image */}
      <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
        <img
          src={meal.strMealThumb}
          alt={`Photo of ${meal.strMeal}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title and Meta */}
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {meal.strMeal}
          </h1>
          <div className="flex flex-wrap gap-2">
            {meal.strCategory && (
              <Badge variant="default">{meal.strCategory}</Badge>
            )}
            {meal.strArea && (
              <Badge variant="secondary">{meal.strArea}</Badge>
            )}
          </div>
        </div>
        
        {/* Favorite Button */}
        <Button
          variant={isFav ? 'default' : 'outline'}
          size="lg"
          onClick={handleToggleFavorite}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFav}
        >
          <Heart 
            className={cn(
              "h-5 w-5 mr-2",
              isFav && "fill-current"
            )} 
            aria-hidden="true"
          />
          {isFav ? 'Saved' : 'Save'}
        </Button>
      </header>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Ingredients */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" aria-hidden="true" />
              Ingredients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" role="list">
              {ingredients.map(({ ingredient, measure }, index) => (
                <li 
                  key={index}
                  className="flex justify-between text-sm border-b border-border pb-2 last:border-0"
                >
                  <span className="font-medium">{ingredient}</span>
                  <span className="text-muted-foreground">{measure}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" aria-hidden="true" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {meal.strInstructions.split('\n').filter(Boolean).map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* YouTube Video */}
      {youtubeId && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Video Tutorial</span>
              <a
                href={meal.strYoutube || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-normal text-primary hover:underline flex items-center gap-1"
              >
                Watch on YouTube
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={`${meal.strMeal} video tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Link */}
      {meal.strSource && (
        <div className="mt-6 text-center">
          <a
            href={meal.strSource}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            View original recipe
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      )}
    </article>
  );
}
