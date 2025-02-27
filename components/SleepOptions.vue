<template>
    <div v-if="show" class="sleep-options active">
      <select v-model="selectedTime">
        <option v-for="hour in hours" :key="hour" :value="hour">
          {{ hour }} Hour{{ hour > 1 ? 's' : '' }}
        </option>
      </select>
      <button @click="handleSet">Set</button>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits, ref } from 'vue';
  
  const props = defineProps({
    show: Boolean,
  });
  const emit = defineEmits(['close', 'set']);
  
  const selectedTime = ref(12);
  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  const handleSet = () => {
    emit('set', selectedTime.value);
    emit('close');
  };
  </script>
  
  <style scoped>
  .sleep-options {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 80, 80, 0.9);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    z-index: 10;
    text-align: center;
    backdrop-filter: blur(10px);
    animation: fadeIn 0.3s ease-in;
  }
  
  select {
    padding: 12px;
    margin-bottom: 15px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    width: 100%;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  
  select:hover {
    background: rgba(255, 255, 255, 0.25);
  }
  
  button {
    padding: 12px 25px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 25px;
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  button:hover,
  button:active {
    background: #ffffff;
    color: #000000;
    transform: translateY(-2px);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @media (max-width: 480px) {
    .sleep-options {
      width: 80%;
      padding: 15px;
    }
    select {
      padding: 10px;
    }
    button {
      padding: 10px 20px;
    }
  }
  </style>