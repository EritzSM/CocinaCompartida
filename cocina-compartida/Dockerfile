# Stage 1: Build the Angular application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build --configuration=production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy built files from the 'builder' stage
# The Angular builder '@angular/build:application' outputs to dist/<project-name>/browser
COPY --from=builder /usr/src/app/dist/cocina-compartida/browser /usr/share/nginx/html

# Copy routing configuration for Nginx if SPA
# By default, nginx needs to route all requests to index.html for Angular routes to work
# Let's create a custom default.conf
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location /api/ { \
        proxy_pass http://backend:3000/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    } \
    \
    location /uploads/ { \
        proxy_pass http://backend:3000/uploads/; \
        proxy_set_header Host $host; \
    } \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
