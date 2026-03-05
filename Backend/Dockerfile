FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY Database/ ./Database/
RUN mkdir -p uploads

EXPOSE 5000
CMD ["node", "src/server.js"]