/**
 * API Client
 * 
 * Centralized API client for making requests to the backend proxy.
 * All requests go through /api/* endpoints - never directly to TheMealDB.
 */

// Base URL for API requests (relative for same-origin, or full URL for production)
const API_BASE = '/api';

/**
 * Type definitions for TheMealDB API responses
 */

// Base meal properties that are always present
interface MealBase {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  strSource?: string | null;
}

// Meal type with dynamic ingredient properties
// Uses Record for the ingredient/measure fields which are strIngredient1-20 and strMeasure1-20
export type Meal = MealBase & Record<string, string | null | undefined | number>;

export interface MealSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

export interface Category {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

export interface MealsResponse {
  meals: Meal[] | null;
}

export interface MealSummaryResponse {
  meals: MealSummary[] | null;
}

export interface CategoriesResponse {
  categories: Category[];
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public isOffline: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(error.error || 'Request failed', response.status);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error - likely offline
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error - you may be offline', 0, true);
    }
    
    throw new ApiError('An unexpected error occurred', 500);
  }
}

// ----- API Methods -----

/**
 * Search meals by name
 * @param query - Search query string
 */
export async function searchMeals(query: string): Promise<Meal[]> {
  const data = await apiFetch<MealsResponse>(
    `/search?s=${encodeURIComponent(query)}`
  );
  return data.meals || [];
}

/**
 * Get meal details by ID
 * @param id - Meal ID
 */
export async function getMealById(id: string): Promise<Meal | null> {
  const data = await apiFetch<MealsResponse>(`/meal/${id}`);
  return data.meals?.[0] || null;
}

/**
 * Get all meal categories
 */
export async function getCategories(): Promise<Category[]> {
  const data = await apiFetch<CategoriesResponse>('/categories');
  return data.categories || [];
}

/**
 * Get meals by category
 * @param category - Category name
 */
export async function getMealsByCategory(category: string): Promise<MealSummary[]> {
  const data = await apiFetch<MealSummaryResponse>(
    `/filter?c=${encodeURIComponent(category)}`
  );
  return data.meals || [];
}

/**
 * Get a random meal
 */
export async function getRandomMeal(): Promise<Meal | null> {
  const data = await apiFetch<MealsResponse>('/random');
  return data.meals?.[0] || null;
}

/**
 * Extract ingredients from a meal object
 * TheMealDB stores ingredients as strIngredient1-20 and strMeasure1-20
 */
export function extractIngredients(meal: Meal): Array<{ ingredient: string; measure: string }> {
  const ingredients: Array<{ ingredient: string; measure: string }> = [];
  
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    // Stop when we hit empty ingredients
    if (ingredient && typeof ingredient === 'string' && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: typeof measure === 'string' ? measure.trim() : '',
      });
    }
  }
  
  return ingredients;
}

/**
 * Get YouTube video ID from URL
 */
export function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match?.[1] || null;
}
