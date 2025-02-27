const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 4200; // 

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve files from public folder

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
  const info = await ytdl.getInfo(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
  return info.videoDetails.video_url;
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});