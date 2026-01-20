/**
 * Cache Utilities
 * 
 * Helper functions for programmatically caching resources
 * for offline access. Works with the service worker.
 */

// Cache names must match those in sw.js
const IMAGE_CACHE = 'recipe-app-images-v1';
const DYNAMIC_CACHE = 'recipe-app-dynamic-v1';

/**
 * Cache a single image URL
 * @param imageUrl - The URL of the image to cache
 */
export async function cacheImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !('caches' in window)) return;
  
  try {
    const cache = await caches.open(IMAGE_CACHE);
    
    // Check if already cached
    const existing = await cache.match(imageUrl);
    if (existing) {
      console.log('[Cache] Image already cached:', imageUrl);
      return;
    }
    
    // Fetch and cache the image
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (response.ok) {
      await cache.put(imageUrl, response);
      console.log('[Cache] Image cached:', imageUrl);
    }
  } catch (error) {
    console.warn('[Cache] Failed to cache image:', imageUrl, error);
  }
}

/**
 * Cache multiple images
 * @param imageUrls - Array of image URLs to cache
 */
export async function cacheImages(imageUrls: string[]): Promise<void> {
  if (!('caches' in window)) return;
  
  const uniqueUrls = [...new Set(imageUrls.filter(Boolean))];
  
  try {
    const cache = await caches.open(IMAGE_CACHE);
    
    await Promise.allSettled(
      uniqueUrls.map(async (url) => {
        const existing = await cache.match(url);
        if (!existing) {
          const response = await fetch(url, { mode: 'cors' });
          if (response.ok) {
            await cache.put(url, response);
          }
        }
      })
    );
    
    console.log('[Cache] Cached', uniqueUrls.length, 'images');
  } catch (error) {
    console.warn('[Cache] Failed to cache images:', error);
  }
}

/**
 * Cache an API response
 * @param url - The API URL to cache
 * @param response - The response data to cache
 */
export async function cacheApiResponse(url: string, data: unknown): Promise<void> {
  if (!('caches' in window)) return;
  
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cached-At': new Date().toISOString(),
      },
    });
    
    await cache.put(url, response);
    console.log('[Cache] API response cached:', url);
  } catch (error) {
    console.warn('[Cache] Failed to cache API response:', url, error);
  }
}

/**
 * Cache a meal's details and image for offline access
 * @param meal - The meal object containing details and image URL
 */
export async function cacheMealForOffline(meal: {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  [key: string]: unknown;
}): Promise<void> {
  if (!meal) return;
  
  // Cache the meal image
  if (meal.strMealThumb) {
    await cacheImage(meal.strMealThumb);
    
    // Also cache the thumbnail variant (MealDB provides /preview suffix)
    const previewUrl = meal.strMealThumb.replace('/images/', '/images/preview/');
    await cacheImage(previewUrl);
  }
  
  // Cache the API response for this meal
  const apiUrl = `/api/meal/${meal.idMeal}`;
  await cacheApiResponse(apiUrl, { meals: [meal] });
}

/**
 * Cache category data and images
 * @param categories - Array of category objects
 */
export async function cacheCategoriesForOffline(
  categories: Array<{
    strCategory: string;
    strCategoryThumb: string;
    strCategoryDescription?: string;
    idCategory?: string;
  }>
): Promise<void> {
  if (!categories || categories.length === 0) return;
  
  // Cache category images
  const imageUrls = categories
    .map((cat) => cat.strCategoryThumb)
    .filter(Boolean);
  
  await cacheImages(imageUrls);
  
  // Cache the categories API response
  await cacheApiResponse('/api/categories', { categories });
  
  console.log('[Cache] Categories cached for offline');
}

/**
 * Cache meals from a category filter
 * @param category - The category name
 * @param meals - Array of meal summaries
 */
export async function cacheCategoryMealsForOffline(
  category: string,
  meals: Array<{
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
  }>
): Promise<void> {
  if (!meals || meals.length === 0) return;
  
  // Cache all meal thumbnail images
  const imageUrls = meals.map((meal) => meal.strMealThumb).filter(Boolean);
  await cacheImages(imageUrls);
  
  // Cache the filter API response
  const apiUrl = `/api/filter?c=${encodeURIComponent(category)}`;
  await cacheApiResponse(apiUrl, { meals });
  
  console.log('[Cache] Category meals cached:', category);
}

/**
 * Check if a URL is cached
 * @param url - The URL to check
 */
export async function isCached(url: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  
  try {
    const response = await caches.match(url);
    return !!response;
  } catch {
    return false;
  }
}

/**
 * Get cache storage estimate
 */
export async function getCacheStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  usagePercentage: number;
} | null> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return null;
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      usagePercentage: estimate.quota 
        ? Math.round((estimate.usage || 0) / estimate.quota * 100) 
        : 0,
    };
  } catch {
    return null;
  }
}
