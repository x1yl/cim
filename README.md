# CIM — Ephemeral Communication Platform

A real-time forum + chat with **zero auth, zero storage**. Everything lives in memory on a tiny WebSocket server. Rooms are gated by 6-character codes you share out-of-band. Closing the server wipes everything — by design.

## Features
- Display-name identity (stored in your browser only)
- Public lobby + code-gated private rooms
- DMs by personal user code
- Forum-style posts with markdown, threaded replies, emoji reactions, pins
- Typing indicators, presence, real-time broadcast
- "Over the top" UI: aurora background, particles, glassmorphism, animations, themes, command palette (⌘K)
- Rate limiting per socket, room size caps

## AI moderation (Mistral)

Messages are checked **server-side** with Mistral's moderation API *before* they are stored or broadcast. The API key never reaches the browser.

```bash
cp .env.example .env
# edit .env and set MISTRAL_API_KEY=...
npm run dev
```

Configuration:
| Env var | Default | Purpose |
|---|---|---|
| `MISTRAL_API_KEY` | — | Required to enable moderation |
| `MISTRAL_MODERATION_MODEL` | `mistral-moderation-2603` | Model ID (falls back to `mistral-moderation-latest` if unavailable) |
| `MODERATION_ENABLED` | `true` | Set `false` to disable checks |
| `MODERATION_FAIL_CLOSED` | `false` | `true` = reject when the API is unreachable; `false` = allow |
| `MODERATION_TIMEOUT_MS` | `8000` | Per-request timeout |

Blocked messages are not persisted or broadcast; the sender gets a `moderation_blocked` event and a red banner listing the flagged categories. Results are cached in-memory for 5 minutes to avoid duplicate API calls.

## Dev
```bash
npm install
npm run dev          # server :3001 + client :5173 (vite proxies /ws)
```

## Production (single port)
```bash
npm run build        # builds client into client/dist
npm start            # server serves client/dist on :3001
```

## Deploy on a Raspberry Pi (open internet)

### Option A: Docker (recommended)
```bash
# on the Pi
git clone <your-fork> cim && cd cim
docker compose up -d --build
# app on http://<pi-ip>:3001
```
For HTTPS (required for wss:// from browsers on the public internet), enable the TLS profile with a domain pointing at the Pi:
```bash
# edit Caddyfile: replace example.com with your domain
docker compose --profile tls up -d
```

### Option B: Bare metal
```bash
# install Node 20+ (nvm or apt)
npm install
npm run build
# run under pm2 / systemd
npm install -g pm2
pm2 start server/index.js --name cim
pm2 save && pm2 startup
```

### systemd unit example
```ini
[Unit]
Description=CIM server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/cim
ExecStart=/usr/bin/node server/index.js
Restart=always
Environment=PORT=3001
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
```

### Notes for open internet
- The server holds all state in memory; restarts wipe rooms/messages.
- Rate limiting is per-socket and basic; for heavy public use consider putting it behind Cloudflare.
- No auth: names are self-claimed. Treat as a casual space, not a secure one.
- WebSockets require the proxy to support upgrades (Caddy/nginx with `proxy_http_version 1.1` + `Upgrade` headers). Caddy handles this automatically.
