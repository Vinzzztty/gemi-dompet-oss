#!/bin/bash
set -e

# 1. Pull the latest changes
git pull origin main

# 2. Generate Prisma Client
npx prisma generate

# 3. Install dependencies and build
npm install && npm run build

# 4. Restart the application using PM2
npx pm2 restart ecosystem.config.js

# 5. Save the PM2 process list
npx pm2 save

# 6. View logs
npx pm2 logs gemi-dompet
