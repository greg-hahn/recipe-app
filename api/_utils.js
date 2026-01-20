/**
 * Shared utilities for MealDB API serverless functions
 */

const MEALDB_API_BASE = process.env.MEALDB_API_BASE || 'https://www.themealdb.com/api/json/v1';
const MEALDB_API_KEY = process.env.MEALDB_API_KEY || '1';

export const getApiUrl = (endpoint) => `${MEALDB_API_BASE}/${MEALDB_API_KEY}/${endpoint}`;

export const fetchFromMealDB = async (endpoint) => {
  const url = getApiUrl(endpoint);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`MealDB API error: ${response.status}`);
  }
  
  return response.json();
};

export const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};
