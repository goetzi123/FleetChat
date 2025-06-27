FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package-broker.json package.json
COPY package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY server/ ./server/
COPY shared/ ./shared/

# Create logs directory
RUN mkdir -p logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start the message broker
CMD ["npm", "start"]