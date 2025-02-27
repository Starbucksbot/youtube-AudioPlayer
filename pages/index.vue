<template>
    <div class="main-container">
      <aside class="sidebar">
        <h2>Recently Played</h2>
        <ul>
          <li v-for="(song, index) in recentSongs" :key="index" @click="playTrack(song.url, song.title || song.query)">
            {{ song.title || song.query }}
          </li>
        </ul>
      </aside>
      <main class="container">
        <header class="header">
          <h1>Radio 4200</h1>
        </header>
        <section class="now-playing">
          <img src="/placeholder.jpg" class="album-art" />
          <SearchBar v-model="searchQuery" @search="search" />
          <div class="track-info">{{ currentTrack ? `Now Playing: ${currentTrack.title}` : '' }}</div>
        </section>
        <audio ref="audioPlayer" />
        <Controls
          :is-playing="isPlaying"
          :progress="progress"
          :current-time="currentTime"
          :duration="duration"
          @toggle-play="togglePlay"
          @previous="previousTrack"
          @next="playNextTrack"  <!-- Renamed from nextTrack to playNextTrack -->
          @toggle-volume="toggleVolume"
        />
        <div class="controls">
          <button @click="toggleSleepOptions">Sleep</button>
          <SleepOptions v-if="showSleepOptions" @close="toggleSleepOptions" @set="setSleepTimer" />
        </div>
      </main>
      <aside class="next-sidebar">
        <h2>Next Track</h2>
        <div>{{ nextTrack ? `Next: ${nextTrack.title}` : 'No next track' }}</div>
      </aside>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import SearchBar from '~/components/SearchBar.vue';
  import Controls from '~/components/Controls.vue';
  import SleepOptions from '~/components/SleepOptions.vue';
  
  const audioPlayer = ref(null);
  const searchQuery = ref('');
  const results = ref([]);
  const currentTrack = ref(null);
  const nextTrack = ref(null);  // Reactive reference for next track state
  const isPlaying = ref(false);
  const isMuted = ref(false);
  const progress = ref(0);
  const duration = ref(0);
  const currentTime = ref(0);
  const sleepTime = ref(null);
  const showSleepOptions = ref(false);
  const volume = ref(1);
  const recentSongs = ref([]);
  let sleepTimer = null;
  let progressInterval = null;
  
  const search = async () => {
    if (!searchQuery.value.trim()) {
      results.value = [];
      return;
    }
    try {
      const response = await $fetch('/api/search', { query: { q: searchQuery.value } });
      results.value = response.results || [];
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
    audioPlayer.value.src = `/api/stream?url=${encodeURIComponent(url)}`;
    currentTrack.value = { url, title };
    isPlaying.value = true;
    try {
      await audioPlayer.value.play();
      queueNextTrack();
    } catch (error) {
      console.error('Playback error:', error);
    }
  };
  
  const togglePlay = () => {
    if (isPlaying.value) {
      audioPlayer.value.pause();
      isPlaying.value = false;
    } else if (currentTrack.value) {
      audioPlayer.value.play();
      isPlaying.value = true;
    }
  };
  
  const previousTrack = () => {
    console.log('Previous not implemented');
  };
  
  const playNextTrack = () => {  // Renamed function to avoid conflict
    if (nextTrack.value) playTrack(nextTrack.value.url, nextTrack.value.title);
    else console.log('No next track');
  };
  
  const toggleVolume = () => {
    isMuted.value = !isMuted.value;
    audioPlayer.value.muted = isMuted.value;
  };
  
  const toggleSleepOptions = () => {
    showSleepOptions.value = !showSleepOptions.value;
  };
  
  const setSleepTimer = (hours) => {
    const selectedHours = hours || sleepTime.value || 12;
    const milliseconds = selectedHours * 60 * 60 * 1000;
    if (sleepTimer) clearTimeout(sleepTimer);
    sleepTime.value = selectedHours;
    sleepTimer = setTimeout(() => {
      audioPlayer.value.pause();
      audioPlayer.value.src = '';
      currentTrack.value = null;
      nextTrack.value = null;
      isPlaying.value = false;
      showSleepOptions.value = false;
    }, milliseconds);
    console.log(`Sleep timer set for ${selectedHours} hours`);
  };
  
  const queueNextTrack = async () => {
    try {
      const response = await $fetch('/api/recommend');
      if (response.url && response.title) {
        nextTrack.value = { url: response.url, title: response.title };
        predownloadTrack(response.url);
      } else {
        nextTrack.value = null;
      }
    } catch (error) {
      console.error('Recommendation error:', error);
      nextTrack.value = null;
    }
  };
  
  const predownloadTrack = async (url) => {
    try {
      const response = await $fetch(`/api/stream?url=${encodeURIComponent(url)}`, { headers: { Range: 'bytes=0-163840' } });
      console.log('Predownloaded 10 seconds of:', url);
    } catch (error) {
      console.error('Predownload failed:', error);
    }
  };
  
  const updateProgress = () => {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (audioPlayer.value && !isNaN(audioPlayer.value.duration)) {
        progress.value = (audioPlayer.value.currentTime / audioPlayer.value.duration) * 100;
        currentTime.value = audioPlayer.value.currentTime;
        duration.value = audioPlayer.value.duration;
      }
    }, 1000);
    audioPlayer.value.onended = () => {
      if (nextTrack.value) playNextTrack();
    };
  };
  
  onMounted(() => {
    updateProgress();
    fetch('/api/recent')
      .then(res => res.json())
      .then(data => (recentSongs.value = data))
      .catch(err => console.error('Recent songs error:', err));
  });
  
  onUnmounted(() => {
    if (progressInterval) clearInterval(progressInterval);
    if (sleepTimer) clearTimeout(sleepTimer);
  });
  </script>
  
  <style scoped>
  .main-container {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 20px;
    width: 100%;
    max-width: 1200px;
    z-index: 1;
  }
  
  .sidebar, .next-sidebar {
    background: rgba(0, 100, 100, 0.9);
    padding: 20px;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px);
    transition: transform 0.3s ease;
  }
  
  .sidebar h2, .next-sidebar h2 {
    font-size: 20px;
    color: #ffffff;
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 500;
  }
  
  .sidebar ul {
    list-style: none;
    padding: 0;
  }
  
  .sidebar li {
    margin: 12px 0;
    color: #00ff00;
    cursor: pointer;
    font-size: 15px;
    word-wrap: break-word;
    transition: color 0.3s ease, transform 0.2s ease;
  }
  
  .sidebar li:hover {
    color: #99ff99;
    transform: translateX(5px);
  }
  
  .next-sidebar div {
    color: #ffffff;
    font-size: 15px;
    padding: 12px;
    background: rgba(0, 255, 255, 0.1);
    border-radius: 10px;
    margin-top: 15px;
    transition: background 0.3s ease;
  }
  
  .next-sidebar div:hover {
    background: rgba(0, 255, 255, 0.2);
  }
  
  .container {
    background: rgba(0, 100, 100, 0.9);
    padding: 25px;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .header {
    text-align: center;
    margin-bottom: 20px;
  }
  
  h1 {
    color: #ffffff;
    font-size: 28px;
    letter-spacing: 2px;
    font-weight: 500;
    margin: 0;
    text-transform: uppercase;
    animation: fadeIn 1s ease-in;
  }
  
  .now-playing {
    position: relative;
    margin: 20px 0;
    padding: 20px;
    border-radius: 15px;
    background: inherit;
    overflow: hidden;
    transition: transform 0.3s ease;
  }
  
  .album-art {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.25;
    z-index: 1;
    filter: blur(5px);
    transition: opacity 0.3s ease;
  }
  
  .track-info {
    font-size: 16px;
    color: #ffffff;
    margin-top: 15px;
    z-index: 2;
    position: relative;
    opacity: 0;
    animation: fadeIn 1s ease-in 0.5s forwards;
  }
  
  .custom-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 25px;
    margin: 20px 0;
    transition: all 0.3s ease;
  }
  
  .control-btn {
    padding: 14px 25px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 30px;
    color: #ffffff;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .control-btn:hover,
  .control-btn:active {
    background: #ffffff;
    color: #000000;
    transform: translateY(-2px) scale(1.05);
  }
  
  .control-btn i {
    font-size: 20px;
  }
  
  .progress-bar {
    flex-grow: 1;
    margin: 0 25px;
    position: relative;
    transition: all 0.3s ease;
  }
  
  .progress {
    height: 8px;
    background: #00ff00;
    border-radius: 4px;
    width: 0%;
    transition: width 0.1s linear, background 0.3s ease;
  }
  
  .progress:hover {
    background: #33cc33;
  }
  
  .time {
    font-size: 13px;
    color: #ffffff;
    margin-top: 8px;
    transition: color 0.3s ease;
  }
  
  .volume-slider {
    display: none;
    position: absolute;
    right: 0;
    top: -120px;
    width: 120px;
    transition: all 0.3s ease;
  }
  
  .volume-slider.active {
    display: block;
  }
  
  input[type="range"] {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    background: rgba(255, 255, 255, 0.15);
    outline: none;
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: #00ff00;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.2s ease;
  }
  
  input[type="range"]:hover::-webkit-slider-thumb {
    transform: scale(1.2);
  }
  
  .controls {
    margin-top: 20px;
    transition: opacity 0.3s ease;
  }
  
  button {
    padding: 14px 25px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 30px;
    color: #ffffff;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  button:hover,
  button:active {
    background: #ffffff;
    color: #000000;
    transform: translateY(-2px) scale(1.05);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @media (max-width: 768px) {
    .main-container {
      grid-template-columns: 1fr;
      gap: 15px;
    }
    .sidebar, .next-sidebar {
      width: 100%;
      max-width: 500px;
    }
    .container {
      width: 100%;
      max-width: 500px;
    }
    h1 {
      font-size: 22px;
    }
    .custom-controls {
      flex-direction: column;
      gap: 15px;
    }
    .progress-bar {
      margin: 10px 0;
    }
  }
  
  @media (max-width: 480px) {
    h1 {
      font-size: 18px;
    }
    .control-btn {
      padding: 10px 15px;
    }
    .volume-slider {
      top: -80px;
      width: 100px;
    }
  }