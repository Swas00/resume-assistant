FROM node:18-alpine
WORKDIR /app

# Copy only backend files
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build TypeScript to JavaScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]