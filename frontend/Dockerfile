FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (will be overridden by volume mount in dev)
RUN npm install --prefer-offline || true

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
