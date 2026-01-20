/**
 * IndexedDB Helpers for Favorites
 * 
 * Uses the 'idb' library for a Promise-based IndexedDB wrapper.
 * Stores complete meal data for offline access.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Meal } from '@/lib/api';
import { cacheMealForOffline } from '@/lib/cache';

// ----- Database Schema -----
interface FavoritesDB extends DBSchema {
  favorites: {
    key: string; // idMeal
    value: FavoriteMeal;
    indexes: {
      'by-date': number;
      'by-name': string;
    };
  };
}

// Extended Meal type with metadata
// Use intersection type to add savedAt without conflicting with index signature
export type FavoriteMeal = Meal & {
  savedAt: number; // Timestamp when saved
}

// Database configuration
const DB_NAME = 'recipe-app-favorites';
const DB_VERSION = 1;

// Database instance (lazy initialized)
let dbInstance: IDBPDatabase<FavoritesDB> | null = null;

/**
 * Get or create the database instance
 */
async function getDB(): Promise<IDBPDatabase<FavoritesDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<FavoritesDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create the favorites object store
      const store = db.createObjectStore('favorites', {
        keyPath: 'idMeal',
      });
      
      // Create indexes for sorting
      store.createIndex('by-date', 'savedAt');
      store.createIndex('by-name', 'strMeal');
    },
    blocked() {
      console.warn('Database upgrade blocked - close other tabs');
    },
    blocking() {
      // Close connection to allow upgrade in other tabs
      dbInstance?.close();
      dbInstance = null;
    },
    terminated() {
      dbInstance = null;
    },
  });

  return dbInstance;
}

// ----- CRUD Operations -----

/**
 * Save a meal to favorites
 * Also caches the meal image and API response for offline access
 * @param meal - The meal to save
 */
export async function saveFavorite(meal: Meal): Promise<void> {
  const db = await getDB();
  
  const favoriteMeal: FavoriteMeal = {
    ...meal,
    savedAt: Date.now(),
  };
  
  // Save to IndexedDB
  await db.put('favorites', favoriteMeal);
  
  // Cache the meal image and API response for offline access
  // This runs in the background and doesn't block the save
  cacheMealForOffline(meal).catch((err) => {
    console.warn('[Favorites] Failed to cache meal for offline:', err);
  });
}

/**
 * Remove a meal from favorites
 * @param mealId - The meal ID to remove
 */
export async function removeFavorite(mealId: string): Promise<void> {
  const db = await getDB();
  await db.delete('favorites', mealId);
}

/**
 * Get a single favorite by ID
 * @param mealId - The meal ID to get
 */
export async function getFavorite(mealId: string): Promise<FavoriteMeal | undefined> {
  const db = await getDB();
  return db.get('favorites', mealId);
}

/**
 * Check if a meal is in favorites
 * @param mealId - The meal ID to check
 */
export async function isFavorite(mealId: string): Promise<boolean> {
  const favorite = await getFavorite(mealId);
  return !!favorite;
}

/**
 * Get all favorites
 * @param sortBy - How to sort the results ('date' | 'name')
 * @param order - Sort order ('asc' | 'desc')
 */
export async function getAllFavorites(
  sortBy: 'date' | 'name' = 'date',
  order: 'asc' | 'desc' = 'desc'
): Promise<FavoriteMeal[]> {
  const db = await getDB();
  
  const indexName = sortBy === 'date' ? 'by-date' : 'by-name';
  const direction = order === 'desc' ? 'prev' : 'next';
  
  // Use cursor to get sorted results
  const favorites: FavoriteMeal[] = [];
  let cursor = await db.transaction('favorites').store.index(indexName).openCursor(null, direction);
  
  while (cursor) {
    favorites.push(cursor.value);
    cursor = await cursor.continue();
  }
  
  return favorites;
}

/**
 * Get the count of favorites
 */
export async function getFavoritesCount(): Promise<number> {
  const db = await getDB();
  return db.count('favorites');
}

/**
 * Clear all favorites
 */
export async function clearAllFavorites(): Promise<void> {
  const db = await getDB();
  await db.clear('favorites');
}

/**
 * Toggle favorite status
 * @param meal - The meal to toggle
 * @returns boolean - true if added, false if removed
 */
export async function toggleFavorite(meal: Meal): Promise<boolean> {
  const exists = await isFavorite(meal.idMeal);
  
  if (exists) {
    await removeFavorite(meal.idMeal);
    return false;
  } else {
    await saveFavorite(meal);
    return true;
  }
}
