FROM node:22-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy backend source code and config
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript to JavaScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start
CMD ["npm", "start"]