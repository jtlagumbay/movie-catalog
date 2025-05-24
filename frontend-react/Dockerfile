FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose ports for both CRA and Vite
EXPOSE 3000 5173

# Default command (can be overridden in docker-compose)
CMD ["npm", "run", "dev"]