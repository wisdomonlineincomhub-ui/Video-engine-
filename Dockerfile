FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg ca-certificates fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libcairo2 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npx remotion browser ensure || true
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/index.js"]