const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const search = require('youtube-search');

const app = express();
const port = 4200;

const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY_HERE'; // Ensure this is valid!

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

app.get('/stream', (req, res) => {
    const url = req.query.url;
    console.log('Streaming URL:', url); // Log the URL for debugging
    if (!url || !ytdl.validateURL(url)) {
        console.error('Invalid or missing URL:', url);
        return res.status(400).send('Invalid video URL');
    }
    try {
        const stream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            requestOptions: { headers: { 'User-Agent': 'Mozilla/5.0' } }
        });
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

app.get('/recommend', (req, res) => {
    const lastSearch = searchHistory[searchHistory.length - 1];
    if (!lastSearch || !lastSearch.url) {
        return res.json({ url: null });
    }

    ytdl.getInfo(lastSearch.url)
        .then(info => {
            const related = info.related_videos && info.related_videos[0]?.id;
            res.json({ url: related ? `https://www.youtube.com/watch?v=${related}` : null });
        })
        .catch(err => {
            console.error('Recommendation error:', err);
            res.json({ url: null });
        });
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