const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const search = require('youtube-search');

const app = express();
const port = 4200;

// Replace with your YouTube API key
const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY_HERE';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let searchHistory = [];
try {
  const data = fs.readFileSync('searchHistory.json', 'utf8');
  searchHistory = JSON.parse(data);
} catch (err) {
  console.log('Starting with empty search history');
}

function saveSearchHistory() {
  fs.writeFileSync('searchHistory.json', JSON.stringify(searchHistory));
}

app.get('/search', async (req, res) => {
  const query = req.query.q;
  try {
    const url = await getFirstVideoUrl(query);
    searchHistory.push({ query, url, timestamp: Date.now() });
    saveSearchHistory();
    res.json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.get('/stream', (req, res) => {
  const url = req.query.url;
  try {
    const stream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      requestOptions: { headers: { 'User-Agent': 'Mozilla/5.0' } }
    });
    res.setHeader('Content-Type', 'audio/mpeg');
    stream.pipe(res);
  } catch (error) {
    res.status(500).send('Streaming error');
  }
});

app.get('/recommend', (req, res) => {
  const lastSearch = searchHistory[searchHistory.length - 1];
  if (!lastSearch) return res.json({ url: null });

  ytdl.getInfo(lastSearch.url).then(info => {
    const related = info.related_videos[0]?.id;
    res.json({ url: related ? `https://www.youtube.com/watch?v=${related}` : null });
  }).catch(() => res.json({ url: null }));
});

async function getFirstVideoUrl(query) {
  const opts = {
    maxResults: 1,
    key: YOUTUBE_API_KEY,
    type: 'video'
  };

  return new Promise((resolve, reject) => {
    search(query, opts, (err, results) => {
      if (err) return reject(err);
      if (!results || results.length === 0) return reject(new Error('No results found'));
      const url = results[0].link; // youtube-search returns 'link' as the video URL
      resolve(url);
    });
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});