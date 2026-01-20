import { fetchFromMealDB, setCorsHeaders } from './_utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { s = '' } = req.query;
    const data = await fetchFromMealDB(`search.php?s=${encodeURIComponent(s)}`);
    
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Failed to fetch meals' });
  }
}
