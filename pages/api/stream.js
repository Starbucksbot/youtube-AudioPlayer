import { spawn } from 'child_process';

export default function handler(req, res) {
  const { url } = req.query;
  console.log('Streaming URL:', url);
  if (!url || !url.includes('youtube.com')) {
    return res.status(400).send('Invalid video URL');
  }

  const ytDlp = spawn('yt-dlp', [url, '-f', 'bestaudio', '-o', '-', '--no-playlist']);

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
}