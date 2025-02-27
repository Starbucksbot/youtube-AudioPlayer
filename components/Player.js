import { useState, useEffect, useRef } from 'react';
import SleepOptions from './SleepOptions';

export default function Player() {
  const audioPlayer = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [nextTrack, setNextTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [sleepTime, setSleepTime] = useState(null);
  const [showSleepOptions, setShowSleepOptions] = useState(false);
  const [volume, setVolume] = useState(1);
  const [recentSongs, setRecentSongs] = useState([]);

  useEffect(() => {
    fetch('/api/recent')
      .then(res => res.json())
      .then(data => setRecentSongs(data))
      .catch(err => console.error('Recent songs error:', err));

    const interval = setInterval(() => {
      if (audioPlayer.current && !isNaN(audioPlayer.current.duration)) {
        setProgress((audioPlayer.current.currentTime / audioPlayer.current.duration) * 100);
        setCurrentTime(audioPlayer.current.currentTime);
        setDuration(audioPlayer.current.duration);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const search = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const playTrack = async (url, title) => {
    if (!url) return;
    if (sleepTimer) {
      clearTimeout(sleepTimer);
      setSleepTimer();
    }
    audioPlayer.current.src = `/api/stream?url=${encodeURIComponent(url)}`;
    setCurrentTrack({ url, title });
    setIsPlaying(true);
    try {
      await audioPlayer.current.play();
    } catch (error) {
      console.error('Playback error:', error);
    }
    queueNextTrack();
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioPlayer.current.pause();
      setIsPlaying(false);
    } else if (currentTrack) {
      audioPlayer.current.play();
      setIsPlaying(true);
    }
  };

  const previousTrack = () => {
    // Placeholder
    console.log('Previous not implemented');
  };

  const nextTrack = () => {
    if (nextTrack) playTrack(nextTrack.url, nextTrack.title);
    else console.log('No next track');
  };

  const toggleVolume = () => {
    setIsMuted(!isMuted);
    audioPlayer.current.muted = !isMuted;
  };

  const toggleSleepOptions = () => setShowSleepOptions(!showSleepOptions);

  const setSleepTimer = () => {
    const hours = parseInt(sleepTime || 12);
    const milliseconds = hours * 60 * 60 * 1000;
    if (sleepTimer) clearTimeout(sleepTimer);
    setSleepTime(hours);
    sleepTimer = setTimeout(() => {
      audioPlayer.current.pause();
      audioPlayer.current.src = '';
      setCurrentTrack(null);
      setNextTrack(null);
      setIsPlaying(false);
    }, milliseconds);
    setShowSleepOptions(false);
    console.log(`Sleep timer set for ${hours} hours`);
  };

  const queueNextTrack = async () => {
    try {
      const response = await fetch('/api/recommend');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data.url && data.title) {
        setNextTrack({ url: data.url, title: data.title });
      } else {
        setNextTrack(null);
      }
    } catch (error) {
      console.error('Recommendation error:', error);
      setNextTrack(null);
    }
  };

  const predownloadTrack = async (url) => {
    try {
      const response = await fetch(`/api/stream?url=${encodeURIComponent(url)}`, {
        headers: { Range: 'bytes=0-163840' }
      });
      if (!response.ok) throw new Error('Predownload failed');
      const blob = await response.blob();
      console.log('Predownloaded 10 seconds of:', url);
    } catch (error) {
      console.error('Predownload failed:', error);
    }
  };

  return (
    <>
      <div className="sidebar">
        <h2>Recently Played</h2>
        <ul>
          {recentSongs.map((song, index) => (
            <li key={index} onClick={() => playTrack(song.url, song.title || song.query)}>
              {song.title || song.query}
            </li>
          ))}
        </ul>
      </div>
      <div className="container">
        <div className="header">
          <h1>Radio 4200</h1>
        </div>
        <div className="now-playing">
          <img src="https://via.placeholder.com/100" className="album-art" />
          <div className="search-overlay">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search YouTube..."
            />
            <button onClick={search}>Search</button>
          </div>
          <div className="track-info">
            {currentTrack ? `Now Playing: ${currentTrack.title}` : ''}
          </div>
        </div>
        <audio ref={audioPlayer} />
        <div className="custom-controls">
          <button className="control-btn" onClick={previousTrack}>
            <i className="fa fa-step-backward"></i>
          </button>
          <button className="control-btn" onClick={togglePlay}>
            <i className={isPlaying ? 'fa fa-pause' : 'fa fa-play'}></i>
          </button>
          <button className="control-btn" onClick={nextTrack}>
            <i className="fa fa-step-forward"></i>
          </button>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
            <span className="time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button className="control-btn" onClick={toggleVolume}>
            <i className={isMuted ? 'fa fa-volume-mute' : 'fa fa-volume-up'}></i>
          </button>
          <div className={volume ? 'volume-slider' : 'volume-slider active'}>
            <input
              type="range"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              min="0"
              max="1"
              step="0.01"
            />
          </div>
        </div>
        <div className="controls">
          <button onClick={toggleSleepOptions}>Sleep</button>
          <SleepOptions
            show={showSleepOptions}
            onClose={toggleSleepOptions}
            onSet={setSleepTimer}
          />
        </div>
      </div>
      <div className="next-sidebar">
        <h2>Next Track</h2>
        <div>{nextTrack ? `Next: ${nextTrack.title}` : 'No next track'}</div>
      </div>
    </>
  );

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }
}