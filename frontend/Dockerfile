# Stage 1: Build React app
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files and install
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy application source
COPY frontend/ ./

# Pass API URL argument if needed (defaults to empty string so requests route through nginx /api reverse proxy)
ARG REACT_APP_API_URL=""
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
