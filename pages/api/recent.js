import fs from 'fs';

let searchHistory = [];
try {
  searchHistory = JSON.parse(fs.readFileSync('searchHistory.json', 'utf8'));
} catch (err) {
  console.log('Starting with empty search history:', err.message);
}

export default function handler(req, res) {
  const recent = searchHistory.slice(-5).reverse();
  console.log('Recent tracks:', recent.length);
  res.status(200).json(recent);
}