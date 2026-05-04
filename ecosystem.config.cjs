module.exports = {
  apps: [{
    name: '2026-05-04-open-design',
    script: 'dist/server/src/index.js',
    cwd: '/home/eve/projects/nightly-mvps/2026-05-04-open-design',
    env: {
      NODE_ENV: 'production',
      PORT: 3477,
    },
    env_file: '/home/eve/projects/nightly-mvps/2026-05-04-open-design/.env',
    instances: 1,
    autorestart: true,
    max_memory_restart: '256M',
  }],
}
