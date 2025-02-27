import { spawn } from 'node:child_process';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const url = query.url;
  console.log('Streaming URL:', url);
  if (!url || !url.includes('youtube.com')) {
    return { statusCode: 400, body: 'Invalid video URL' };
  }

  const ytDlp = spawn('yt-dlp', [url, '-f', 'bestaudio', '-o', '-', '--no-playlist']);

  ytDlp.on('error', (err) => {
    console.error('yt-dlp error:', err);
    if (err.code === 'ENOENT') {
      return { statusCode: 500, body: 'yt-dlp not found. Please install it with `pip3 install yt-dlp`.' };
    }
    return { statusCode: 500, body: 'Streaming failed' };
  });

  setHeader(event, 'Content-Type', 'audio/mpeg');
  ytDlp.stdout.pipe(getResponse(event));
  ytDlp.stderr.on('data', (data) => console.error('yt-dlp stderr:', data.toString()));
  ytDlp.on('close', (code) => {
    if (code !== 0) console.log('Stream closed with code:', code);
  });
});