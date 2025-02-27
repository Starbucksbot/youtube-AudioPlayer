import { readFileSync } from 'node:fs';

let searchHistory = [];
try {
  searchHistory = JSON.parse(readFileSync('searchHistory.json', 'utf8'));
} catch (err) {
  console.log('Starting with empty search history:', err.message);
}

export default defineEventHandler(() => {
  const recent = searchHistory.slice(-5).reverse();
  console.log('Recent tracks:', recent.length);
  return recent;
});