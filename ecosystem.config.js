module.exports = {
    apps: [
      {
        name: 'Radio4200',
        exec_mode: 'cluster',
        instances: 'max',
        script: './.output/server/index.mjs',
        env: {
          NODE_ENV: 'development',
          PORT: 4200,
        },
        env_production: {
          NODE_ENV: 'production',
          PORT: 4200,
        },
      },
    ],
  };