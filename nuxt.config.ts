export default defineNuxtConfig({
    devtools: { enabled: true },
    css: ['~/public/style.css'],
    runtimeConfig: {
      public: {
        youtubeApiKey: process.env.YOUTUBE_API_KEY,
      },
    },
    server: {
      port: process.env.PORT || 4200,
    },
    hooks: {
      'server:listen' (server) {
        console.log(`Nuxt server listening on port ${process.env.PORT || 4200}`);
      },
    },
  });