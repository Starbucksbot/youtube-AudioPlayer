import { youtubeSearch } from 'youtube-search';

export default defineEventHandler(async (event) => {
  const query = getQuery(event).q;
  if (!query) {
    return { error: 'Query parameter is required' };
  }

  const opts = {
    maxResults: 5,
    key: process.env.YOUTUBE_API_KEY,
    type: 'video',
  };

  try {
    const results = await new Promise((resolve, reject) => {
      youtubeSearch(query, opts, (err, results) => (err ? reject(err) : resolve(results)));
    });
    return { results: results.map(r => ({ title: r.title, url: r.link })) };
  } catch (error) {
    console.error('Search error:', error);
    return { error: 'Search failed' };
  }
});