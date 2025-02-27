export default defineNuxtConfig({
    devtools: { enabled: true },
    css: ['~/public/style.css'],
    runtimeConfig: {
      public: {
        youtubeApiKey: process.env.YOUTUBE_API_KEY,
      },
    },
    modules: ['@nuxtjs/eslint-config-typescript'],
  });