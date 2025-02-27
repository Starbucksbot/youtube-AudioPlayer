import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

let searchHistory = [];
try {
  searchHistory = JSON.parse(readFileSync('searchHistory.json', 'utf8'));
} catch (err) {
  console.log('Starting with empty search history:', err.message);
}

function saveSearchHistory() {
  if (searchHistory.length > 30) searchHistory = searchHistory.slice(-30);
  writeFileSync('searchHistory.json', JSON.stringify(searchHistory));
}

export default defineEventHandler((event) => {
  const lastSearch = searchHistory[searchHistory.length - 1];
  console.log('Last search:', lastSearch);
  if (!lastSearch || !lastSearch.url) {
    return { url: null, title: null };
  }

  const ytDlp = spawn('yt-dlp', [lastSearch.url, '--dump-json']);
  let output = '';
  ytDlp.stdout.on('data', (data) => (output += data));
  ytDlp.on('close', (code) => {
    if (code === 0) {
      const parsedInfo = JSON.parse(output);
      const related = parsedInfo.related_videos?.[0];
      return {
        url: related ? `https://www.youtube.com/watch?v=${related.id}` : null,
        title: related ? related.title : null,
      };
    }
    console.log('Recommendation failed, code:', code);
    return { url: null, title: null };
  });
});