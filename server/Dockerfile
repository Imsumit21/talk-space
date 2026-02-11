FROM node:20-bullseye

# Install build tools required for mediasoup (C++ native addon)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy shared types first (dependency)
COPY shared/ /app/shared/

# Copy server package files and install
COPY server/package*.json ./server/
COPY package.json ./
WORKDIR /app/server
RUN npm install

# Copy server source
COPY server/ /app/server/

EXPOSE 3000

CMD ["npm", "run", "dev"]
