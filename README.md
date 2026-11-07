# CIM — Ephemeral Communication Platform

A real-time forum + chat with **zero auth, zero storage**. Everything lives in memory on a tiny WebSocket server. Rooms are gated by 6-character codes you share out-of-band. Closing the server wipes everything — by design.

## Features
- Editable display-name identity (stored in your browser only, moderated before it goes live)
- Public lobby + code-gated private rooms
- DMs by personal user code
- Forum-style posts with markdown, threaded replies, emoji reactions, pins
- Typing indicators, presence, real-time broadcast
- "Over the top" UI: accent-themed aurora background, particles, glassmorphism, animations, themes, command palette (⌘K)
- Rate limiting per socket, room size caps

## AI moderation (Mistral)

Messages **and display names** are checked **server-side** with Mistral's moderation API *before* they are stored, broadcast, or accepted. The API key never reaches the browser.

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

Blocked messages are not persisted or broadcast; the sender gets a `moderation_blocked` event and a red banner listing the flagged categories. Display names are moderated on first entry and on every change — a blocked name is rejected and the previous name is kept. Results are cached in-memory for 5 minutes to avoid duplicate API calls.

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

Use a **64-bit** Raspberry Pi OS (Pi 4/5 recommended) and give the Pi a static LAN IP.

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Get the code + configure
```bash
git clone https://github.com/x1yl/cim.git cim
cd cim
cp .env.example .env
nano .env            # set MISTRAL_API_KEY=... (leave blank to disable moderation)
```

### 3. Test on the LAN
```bash
docker compose up -d --build
# open http://<pi-lan-ip>:3002
```
Check logs / health:
```bash
docker compose logs -f cim
curl http://localhost:3002/health
```

### 4. Put it on the open internet with HTTPS
WebSockets from an HTTPS page must use `wss://`, so you need TLS. Two good options:

**Option A — Domain + router port forwarding (Caddy handles Let's Encrypt)**
1. Point a DNS `A` record (e.g. `cim.example.com`) at your public IP.
2. Forward TCP **80** and **443** on your router to the Pi.
3. Edit `Caddyfile`: replace `example.com` with your domain.
4. Start the TLS profile:
   ```bash
   docker compose --profile tls up -d
   ```
   Caddy obtains and renews the certificate automatically.

**Option B — Cloudflare Tunnel (no port forwarding)**
1. Create a tunnel in the Cloudflare dashboard and install `cloudflared` on the Pi.
2. Route `cim.example.com` → `http://localhost:3002`.
3. Cloudflare terminates TLS; no open ports on your router.
   ```bash
   # example
   cloudflared tunnel --url http://localhost:3002
   ```

### Updating
```bash
cd cim && git pull
docker compose up -d --build
```

### Option C: Bare metal (no Docker)
```bash
sudo apt install -y nodejs npm
npm install
npm run build
sudo npm install -g pm2
pm2 start server/index.js --name cim
pm2 save && pm2 startup
```
Use Caddy/nginx in front for HTTPS (same as above).

### Notes for open internet
- All state is in memory; restarts wipe rooms/messages.
- Rate limiting is per-socket and basic; put Cloudflare in front for a public deployment.
- No auth: names are self-claimed. Treat it as a casual space, not a secure one.
- Keep `.env` private; it contains your Mistral API key. It is already gitignored.
- WebSockets require proxy upgrade support; Caddy handles this automatically.
- Docker images for Node 20 support arm64, but a 32-bit OS will not work — use 64-bit.
