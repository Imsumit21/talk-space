FROM node:20-alpine AS build

WORKDIR /app

# Copy shared types (dependency)
COPY shared/ /app/shared/

# Copy client package files and install
COPY client/package*.json ./client/
COPY package.json ./
WORKDIR /app/client
RUN npm install

# Copy client source and build
COPY client/ /app/client/
RUN npm run build

# Production: serve with nginx
FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
