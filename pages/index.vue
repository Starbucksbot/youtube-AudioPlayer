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
          @next="nextTrack"
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
  const nextTrack = ref(null);
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
  
  const nextTrack = () => {
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
      if (nextTrack.value) nextTrack();
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