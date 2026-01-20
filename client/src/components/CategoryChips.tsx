import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryChipsProps {
  categories: Array<{
    strCategory: string;
    strCategoryThumb?: string;
  }>;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  isLoading?: boolean;
}

/**
 * Category Chips Component
 * 
 * Horizontal scrollable list of category filter buttons.
 * Allows users to filter recipes by category.
 */
export function CategoryChips({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading,
}: CategoryChipsProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="list">
        {Array.from({ length: 8 }).map((_, i) => (
          <Badge 
            key={i} 
            variant="outline" 
            className="animate-pulse bg-muted h-8 w-20"
          >
            &nbsp;
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <nav 
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      aria-label="Recipe categories"
      role="navigation"
    >
      {/* All categories button */}
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className="shrink-0"
        aria-pressed={selectedCategory === null}
      >
        All
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category.strCategory}
          variant={selectedCategory === category.strCategory ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectCategory(category.strCategory)}
          className={cn(
            "shrink-0",
            selectedCategory === category.strCategory && "ring-2 ring-ring ring-offset-2"
          )}
          aria-pressed={selectedCategory === category.strCategory}
        >
          {category.strCategory}
        </Button>
      ))}
    </nav>
  );
}
