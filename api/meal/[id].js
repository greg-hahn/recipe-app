import { fetchFromMealDB, setCorsHeaders } from '../_utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid meal ID' });
    }
    
    const data = await fetchFromMealDB(`lookup.php?i=${id}`);
    
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Meal lookup error:', error);
    return res.status(500).json({ error: 'Failed to fetch meal' });
  }
}
