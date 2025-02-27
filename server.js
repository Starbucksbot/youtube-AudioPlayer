const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const search = require('youtube-search');
const youtubedl = require('yt-dlp-exec'); // New dependency

const app = express();
const port = 4200;

const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY_HERE'; // Replace with your key

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
        const results = await getVideoResults(query);
        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/stream', async (req, res) => {
    const url = req.query.url;
    console.log('Streaming URL:', url);
    if (!url || !url.includes('youtube.com')) {
        console.error('Invalid or missing URL:', url);
        return res.status(400).send('Invalid video URL');
    }
    try {
        // Use yt-dlp to stream audio
        const stream = youtubedl.execStream([
            url,
            '-f', 'bestaudio', // Best audio format
            '-o', '-', // Output to stdout (stream)
            '--no-playlist', // Avoid playlists
        ]);
        res.setHeader('Content-Type', 'audio/mpeg');
        stream.on('error', (err) => {
            console.error('Stream error:', err);
            res.status(500).send('Streaming failed');
        });
        stream.pipe(res);
    } catch (error) {
        console.error('Stream setup error:', error);
        res.status(500).send('Streaming error');
    }
});

app.get('/recommend', async (req, res) => {
    const lastSearch = searchHistory[searchHistory.length - 1];
    if (!lastSearch || !lastSearch.url) {
        return res.json({ url: null });
    }
    try {
        const info = await youtubedl(lastSearch.url, ['--dump-json']);
        const parsedInfo = JSON.parse(info);
        const related = parsedInfo.related_videos?.[0]?.id || null;
        res.json({ url: related ? `https://www.youtube.com/watch?v=${related}` : null });
    } catch (err) {
        console.error('Recommendation error:', err);
        res.json({ url: null });
    }
});

app.get('/recent', (req, res) => {
    const recent = searchHistory.slice(-5).reverse();
    res.json(recent);
});

async function getVideoResults(query) {
    const opts = {
        maxResults: 5,
        key: YOUTUBE_API_KEY,
        type: 'video'
    };
    return new Promise((resolve, reject) => {
        search(query, opts, (err, results) => {
            if (err) return reject(err);
            if (!results || results.length === 0) return resolve([]);
            const formattedResults = results.map(result => ({
                title: result.title,
                url: result.link
            }));
            if (formattedResults.length > 0) {
                searchHistory.push({ query, url: formattedResults[0].url, timestamp: Date.now() });
                saveSearchHistory();
            }
            resolve(formattedResults);
        });
    });
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});