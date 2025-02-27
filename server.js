const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const search = require('youtube-search');
const { spawn } = require('child_process');
const config = require('./config');

const app = express();
const port = config.PORT;

app.use(cors());
app.use(express.json());

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html from the public folder as the default route
app.get('/', (req, res) => {
    console.log('Serving index.html from:', path.join(__dirname, 'public', 'index.html'));
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let searchHistory = [];
try {
    const data = fs.readFileSync('searchHistory.json', 'utf8');
    searchHistory = JSON.parse(data);
    console.log('Loaded search history:', searchHistory.length, 'entries');
} catch (err) {
    console.log('Starting with empty search history:', err.message);
}

function saveSearchHistory() {
    if (searchHistory.length > 30) {
        searchHistory = searchHistory.slice(-30); // Keep last 30
    }
    fs.writeFileSync('searchHistory.json', JSON.stringify(searchHistory));
    console.log('Saved search history, length:', searchHistory.length);
}

app.get('/search', async (req, res) => {
    const query = req.query.q;
    console.log('Search request for:', query);
    if (!query) {
        console.log('No query provided');
        return res.status(400).json({ error: 'Query parameter is required' });
    }
    try {
        const results = await getVideoResults(query);
        console.log('Search results:', results.length);
        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/stream', (req, res) => {
    const url = req.query.url;
    console.log('Streaming URL:', url);
    if (!url || !url.includes('youtube.com')) {
        console.error('Invalid or missing URL:', url);
        return res.status(400).send('Invalid video URL');
    }
    try {
        const ytDlp = spawn('yt-dlp', [
            url,
            '-f', 'bestaudio',
            '-o', '-',
            '--no-playlist',
        ]);

        ytDlp.on('error', (err) => {
            console.error('yt-dlp error:', err);
            if (err.code === 'ENOENT') {
                return res.status(500).send('yt-dlp not found. Please install it with `pip3 install yt-dlp`.');
            }
            res.status(500).send('Streaming failed');
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        ytDlp.stdout.pipe(res);
        ytDlp.stderr.on('data', (data) => console.error('yt-dlp stderr:', data.toString()));
        ytDlp.on('close', (code) => {
            if (code !== 0 && !res.headersSent) res.status(500).send('Streaming failed');
        });
    } catch (error) {
        console.error('Stream setup error:', error);
        if (!res.headersSent) res.status(500).send('Streaming error');
    }
});

app.get('/recommend', async (req, res) => {
    const lastSearch = searchHistory[searchHistory.length - 1];
    console.log('Last search:', lastSearch);
    if (!lastSearch || !lastSearch.url) {
        console.log('No last search available');
        return res.json({ url: null, title: null });
    }
    try {
        const ytDlp = spawn('yt-dlp', [lastSearch.url, '--dump-json']);
        let output = '';
        ytDlp.stdout.on('data', (data) => (output += data));
        ytDlp.on('close', (code) => {
            if (code === 0) {
                const parsedInfo = JSON.parse(output);
                const related = parsedInfo.related_videos?.[0];
                res.json({
                    url: related ? `https://www.youtube.com/watch?v=${related.id}` : null,
                    title: related ? related.title : null
                });
            } else {
                console.log('Recommendation failed, code:', code);
                res.json({ url: null, title: null });
            }
        });
    } catch (err) {
        console.error('Recommendation error:', err);
        res.json({ url: null, title: null });
    }
});

app.get('/recent', (req, res) => {
    const recent = searchHistory.slice(-5).reverse();
    console.log('Recent tracks:', recent.length);
    res.json(recent);
});

async function getVideoResults(query) {
    const opts = {
        maxResults: 5,
        key: config.YOUTUBE_API_KEY,
        type: 'video'
    };
    return new Promise((resolve, reject) => {
        search(query, opts, (err, results) => {
            if (err) {
                console.error('YouTube search error:', err);
                return reject(err);
            }
            if (!results || results.length === 0) {
                console.log('No search results found');
                return resolve([]);
            }
            const formattedResults = results.map(result => ({
                title: result.title,
                url: result.link
            }));
            if (formattedResults.length > 0) {
                searchHistory.push({
                    query,
                    url: formattedResults[0].url,
                    title: formattedResults[0].title,
                    timestamp: Date.now()
                });
                saveSearchHistory();
            }
            resolve(formattedResults);
        });
    });
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});