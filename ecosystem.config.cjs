module.exports = {
  apps: [
    {
      name: "discord-scam-guard",
      script: "src/index.js",
      cwd: __dirname,
      interpreter: "node",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
