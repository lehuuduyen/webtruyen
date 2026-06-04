module.exports = {
  apps: [
    {
      name: 'truyen-api',
      script: 'server/index.js',
      cwd: '/www/wwwroot/truyenfullai.com',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        SITE_URL: 'https://truyenfullai.com',
      },
    },
    {
      name: 'truyen-web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3000',
      cwd: '/www/wwwroot/truyenfullai.com/client',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        SITE_URL: 'https://truyenfullai.com',
        NEXT_PUBLIC_SITE_URL: 'https://truyenfullai.com',
      },
    },
  ],
};
