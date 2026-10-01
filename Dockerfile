FROM node:20-bookworm-slim

# Install system dependencies: FFmpeg, Python3, curl, ca-certificates, and Deno
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    unzip \
    ca-certificates \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && curl -fsSL https://deno.land/install.sh | sh \
    && mv /root/.deno/bin/deno /usr/local/bin/deno \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY server/ ./server/
COPY public/ ./public/

# Environment settings
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]
