import { youtubeSearch } from 'youtube-search';

export default async function handler(req, res) {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter is required' });
  
    const opts = {
      maxResults: 5,
      key: process.env.YOUTUBE_API_KEY,
      type: 'video',
    };
  
    try {
      const results = await new Promise((resolve, reject) => {
        youtubeSearch(q, opts, (err, results) => (err ? reject(err) : resolve(results)));
      });
      res.status(200).json({ results: results.map(r => ({ title: r.title, url: r.link })) });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  }