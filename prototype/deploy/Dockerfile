FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY backend ./backend
COPY frontend ./frontend
COPY docs ./docs
ENV HOST=0.0.0.0 PORT=4173
USER node
EXPOSE 4173
CMD ["node", "backend/server.mjs"]
