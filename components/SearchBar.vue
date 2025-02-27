<template>
    <div class="search-overlay">
      <input v-model="query" @keyup.enter="emitSearch" placeholder="Search YouTube..." />
      <button @click="emitSearch">Search</button>
    </div>
  </template>
  
  <script setup>
  import { ref, defineEmits } from 'vue';
  
  const query = ref('');
  const emit = defineEmits(['search']);
  
  const emitSearch = () => {
    emit('search', query.value);
    query.value = '';
  };
  </script>
  
  <style scoped>
  .search-overlay {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    gap: 10px;
    margin: 10px 0;
  }
  
  input {
    padding: 12px 20px;
    width: 70%;
    max-width: 250px;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    outline: none;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
  }
  
  input::placeholder {
    color: #cccccc;
  }
  
  button {
    padding: 12px 20px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 25px;
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.3s ease, color 0.3s ease;
  }
  
  button:hover,
  button:active {
    background: #ffffff;
    color: #000000;
  }
  
  @media (max-width: 480px) {
    input {
      width: 60%;
      max-width: none;
      padding: 10px 15px;
    }
    button {
      padding: 10px 15px;
    }
  }
  </style>