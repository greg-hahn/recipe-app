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
    const { c } = req.query;
    
    if (!c) {
      return res.status(400).json({ error: 'Category parameter (c) is required' });
    }
    
    const data = await fetchFromMealDB(`filter.php?c=${encodeURIComponent(c)}`);
    
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Filter error:', error);
    return res.status(500).json({ error: 'Failed to filter meals' });
  }
}
