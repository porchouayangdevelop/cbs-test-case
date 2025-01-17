# Use official node image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

RUN npm install -g pnpm@latest

# Copy package files
COPY package*.json ./

# Install dependencies
RUN pnpm install

RUN pnpm add -D nodemon

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]