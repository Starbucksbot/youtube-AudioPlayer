<template>
  <div class="container">
    <h1>Audio Player</h1>
    <div class="search-bar">
      <input v-model="searchQuery" @keyup.enter="search" placeholder="Search YouTube..." />
      <button @click="search">Search</button>
    </div>
    <audio ref="player" controls autoplay @ended="playNext"></audio>
    <div v-if="currentTrack" class="result">
      Playing: {{ currentTrack.split('v=')[1] }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: '',
      currentTrack: null
    };
  },
  methods: {
    async search() {
      if (!this.searchQuery) return;
      try {
        const response = await fetch(`/search?q=${encodeURIComponent(this.searchQuery)}`);
        const data = await response.json();
        this.playTrack(data.url);
      } catch (error) {
        console.error('Search failed:', error);
      }
    },
    playTrack(url) {
      this.currentTrack = url;
      this.$refs.player.src = `/stream?url=${encodeURIComponent(url)}`;
      this.$refs.player.play();
    },
    async playNext() {
      try {
        const response = await fetch('/recommend');
        const data = await response.json();
        if (data.url) this.playTrack(data.url);
      } catch (error) {
        console.error('Recommendation failed:', error);
      }
    }
  }
};
</script>