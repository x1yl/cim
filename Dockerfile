# ---- build client ----
FROM node:20-alpine AS client-build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
RUN npm install --workspace=client --include-workspace-root=false
COPY client ./client
RUN npm run build --workspace=client

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json ./server/
RUN cd server && npm install --omit=dev
COPY server ./server
COPY --from=client-build /app/client/dist ./client/dist
EXPOSE 3001
USER node
CMD ["node", "server/index.js"]
