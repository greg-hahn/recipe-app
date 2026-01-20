/**
 * MealDB Proxy Routes
 * 
 * These routes proxy requests to TheMealDB API, hiding the API key
 * from the client. Includes in-memory caching for categories.
 */

import { Router } from 'express';

const router = Router();

// ----- Configuration -----
const MEALDB_API_BASE = process.env.MEALDB_API_BASE || 'https://www.themealdb.com/api/json/v1';
const MEALDB_API_KEY = process.env.MEALDB_API_KEY || '1';

// Construct the full API URL
const getApiUrl = (endpoint) => `${MEALDB_API_BASE}/${MEALDB_API_KEY}/${endpoint}`;

// ----- In-Memory Cache -----
// Simple TTL cache for categories (they rarely change)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data or fetch fresh
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data
 * @param {number} ttl - Time to live in milliseconds
 */
const getCachedOrFetch = async (key, fetchFn, ttl = CACHE_TTL) => {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

/**
 * Helper to fetch from TheMealDB with error handling
 * @param {string} endpoint - API endpoint
 * @returns {Promise<object>} - JSON response
 */
const fetchFromMealDB = async (endpoint) => {
  const url = getApiUrl(endpoint);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = new Error(`MealDB API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  
  return response.json();
};

// ----- Routes -----

/**
 * GET /api/search
 * Search meals by name
 * Query params: s (search term)
 */
router.get('/search', async (req, res, next) => {
  try {
    const { s = '' } = req.query;
    const data = await fetchFromMealDB(`search.php?s=${encodeURIComponent(s)}`);
    
    // Add cache control headers for client-side caching
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/meal/:id
 * Get meal details by ID
 */
router.get('/meal/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid meal ID' });
    }
    
    const data = await fetchFromMealDB(`lookup.php?i=${id}`);
    
    // Add cache control headers
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories
 * List all meal categories
 * Uses in-memory caching for performance
 */
router.get('/categories', async (req, res, next) => {
  try {
    const data = await getCachedOrFetch(
      'categories',
      () => fetchFromMealDB('categories.php'),
      CACHE_TTL
    );
    
    // Longer cache for categories as they rarely change
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/filter
 * Filter meals by category
 * Query params: c (category name)
 */
router.get('/filter', async (req, res, next) => {
  try {
    const { c } = req.query;
    
    if (!c) {
      return res.status(400).json({ error: 'Category parameter (c) is required' });
    }
    
    const data = await fetchFromMealDB(`filter.php?c=${encodeURIComponent(c)}`);
    
    res.set('Cache-Control', 'public, max-age=600'); // 10 minutes
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/random
 * Get a random meal
 */
router.get('/random', async (req, res, next) => {
  try {
    const data = await fetchFromMealDB('random.php');
    
    // No caching for random meals
    res.set('Cache-Control', 'no-store');
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export { router as mealdbRouter };
