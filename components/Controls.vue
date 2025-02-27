<template>
    <div class="custom-controls">
      <button class="control-btn" @click="$emit('previous')">
        <i class="fa fa-step-backward"></i>
      </button>
      <button class="control-btn" @click="$emit('toggle-play')">
        <i :class="isPlaying ? 'fa fa-pause' : 'fa fa-play'"></i>
      </button>
      <button class="control-btn" @click="$emit('next')">
        <i class="fa fa-step-forward"></i>
      </button>
      <div class="progress-bar">
        <div class="progress" :style="{ width: `${progress}%` }"></div>
        <span class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>
      <button class="control-btn" @click="$emit('toggle-volume')">
        <i :class="isMuted ? 'fa fa-volume-mute' : 'fa fa-volume-up'"></i>
      </button>
      <div :class="['volume-slider', volume ? '' : 'active']">
        <input
          type="range"
          v-model="volume"
          @input="$emit('update:volume', $event.target.value)"
          min="0"
          max="1"
          step="0.01"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    isPlaying: Boolean,
    progress: Number,
    currentTime: Number,
    duration: Number,
    volume: Number,
  });
  const emit = defineEmits(['toggle-play', 'previous', 'next', 'toggle-volume', 'update:volume']);
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
  </script>
  
  <style scoped>
  .custom-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin: 20px 0;
    transition: all 0.3s ease;
  }
  
  .control-btn {
    padding: 12px 20px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 25px;
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.3s ease, color 0.3s ease, transform 0.2s ease;
  }
  
  .control-btn:hover,
  .control-btn:active {
    background: #ffffff;
    color: #000000;
    transform: scale(1.05);
  }
  
  .control-btn i {
    font-size: 18px;
  }
  
  .progress-bar {
    flex-grow: 1;
    margin: 0 20px;
    position: relative;
    transition: opacity 0.3s ease;
  }
  
  .progress {
    height: 6px;
    background: #00ff00;
    border-radius: 3px;
    width: 0%;
    transition: width 0.1s linear;
  }
  
  .time {
    font-size: 12px;
    color: #ffffff;
    margin-top: 5px;
    transition: color 0.3s ease;
  }
  
  .volume-slider {
    display: none;
    position: absolute;
    right: 0;
    top: -100px;
    width: 100px;
    transition: opacity 0.3s ease;
  }
  
  .volume-slider.active {
    display: block;
  }
  
  input[type="range"] {
    width: 100%;
    height: 6px;
    -webkit-appearance: none;
    background: rgba(255, 255, 255, 0.1);
    outline: none;
    border-radius: 3px;
    transition: background 0.3s ease;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #00ff00;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.2s ease;
  }
  
  input[type="range"]:hover::-webkit-slider-thumb {
    transform: scale(1.2);
  }
  
  @media (max-width: 768px) {
    .custom-controls {
      flex-direction: column;
      gap: 10px;
    }
    .progress-bar {
      margin: 10px 0;
    }
  }
  
  @media (max-width: 480px) {
    .control-btn {
      padding: 10px 15px;
    }
  }
  </style>