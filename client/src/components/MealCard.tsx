import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MealCardProps {
  id: string;
  title: string;
  image: string;
  category?: string;
  area?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

/**
 * Meal Card Component
 * 
 * Displays a recipe card with image, title, and favorite button.
 * Used in the Home page grid and Favorites page.
 */
export function MealCard({
  id,
  title,
  image,
  category,
  area,
  isFavorite,
  onToggleFavorite,
}: MealCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <Link 
        to={`/recipe/${id}`}
        className="block"
        aria-label={`View recipe: ${title}`}
      >
        <div className="relative aspect-video overflow-hidden">
          <img
            src={image}
            alt={`Photo of ${title}`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          {/* Category/Area badges */}
          {(category || area) && (
            <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
              {category && (
                <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
                  {category}
                </Badge>
              )}
              {area && (
                <Badge variant="outline" className="backdrop-blur-sm bg-background/80">
                  {area}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link 
            to={`/recipe/${id}`}
            className="flex-1 min-w-0"
          >
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          
          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite();
            }}
            aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            aria-pressed={isFavorite}
            className="shrink-0"
          >
            <Heart 
              className={cn(
                "h-5 w-5 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )} 
              aria-hidden="true"
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
