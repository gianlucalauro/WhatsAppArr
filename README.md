# WhatsAppArr

Forward *Arrs webhook events to WhatsApp users or groups.

WhatsAppArr is a tiny Express server that connects to WhatsApp via whatsapp-web.js and exposes a simple webhook endpoint. When your *arr apps (Radarr, Sonarr, etc.) send a webhook payload, WhatsAppArr formats it and posts a notification to a specified WhatsApp user or group.

Note: At the moment, the message builder includes templates only for Radarr events (Download, MovieDelete, generic). Other *arrs will be implemented soon.

## Features
- QR-based WhatsApp login (persisted with LocalAuth)
- Webhook endpoint to receive events from *arr software
- Send to either a WhatsApp group (by name) or to a user (by contact name or phone number)
- Docker image or plain Node.js execution

## Prerequisites
- Node.js 18+ (if running locally without Docker)
- A WhatsApp account that can be used by this automation
- Access to your *arr application(s) to configure webhooks

## Security and disclaimers
- This project uses an unofficial API (whatsapp-web.js) that automates WhatsApp Web. Use at your own risk.
- Authentication data is stored locally in the `auth_data/` folder. Keep it private and do not commit it.
- Only expose the webhook endpoint to trusted networks, or put it behind authentication/reverse proxy controls.

## Getting started

### 1) Clone the repository
```
 git clone <your-fork-or-repo-url>
 cd WhatsAppArr
```

### 2) Install dependencies (local Node.js)
```
 npm install
```

### 3) Run the server (local Node.js)
```
 node app.js
```

On first start, you will see a QR code in the terminal. Open WhatsApp on your phone and scan the code (Linked devices). After successful login, the session will be stored under `auth_data/` so you won’t need to scan again unless you delete that folder or the session expires.

The server listens on `PORT` environment variable or defaults to `3000`.

### 4) Run with Docker

Build and run locally:

`docker build -t whatsapparr .`
```
 docker run --name whatsapparr \
   -p 3000:3000 \
   -e PORT=3000 \
   -v "$(pwd)/auth_data:/app/auth_data" \
   whatsapparr
```

## Configuration

Environment variables:
- PORT: Port for the HTTP server (default: 3000)

Folders/files:
- auth_data/: Persisted session for WhatsApp login (auto-created). It is ignored by git and should be persisted across restarts.

## Webhook API

Single POST endpoint:
```
 POST /:type/:chatNameBase64
```

Parameters:
- type: `group` or `user`.
- chatNameBase64: Base64-encoded name of the target chat.
  - group: exact group name as it appears in WhatsApp.
  - user: either the contact name as shown in WhatsApp or the phone number (digits only). Phone numbers are matched after stripping non-digits.

Body: JSON payload coming from your *arr application. The app currently includes a formatter for Radarr payloads.

Response codes:
- 200: Message dispatched
- 400: Invalid `type`
- 404: Chat not found
- 503: WhatsApp client not ready yet (e.g., before login completes)
- 500: Internal error while sending the message

### Example: Send a test message

You can trigger a test event manually. The server recognizes an event with `eventType: "Test"` and includes `instanceName` for the display:

Request:
```
POST http://localhost:3000/group/UGl6emEgTmVyZCBEb21hbmRh  # "Pizza Nerd Domanda" encoded in Base64 as an example
Content-Type: application/json

{
  "instanceName": "Radarr",
  "eventType": "Test"
}
```

Note: Replace the path segment after `/group/` with the base64 of your real group name. Example to encode a name in bash:
```
 echo -n "My Group Name" | base64
```

### Example: Radarr webhook
Configure Radarr to send a webhook to (adjust host/port):
```
 http://your-host:3000/group/TXkgTW92aWUgR3JvdXA=
```

Typical Radarr body fields that are used by WhatsAppArr’s Radarr formatter:
```
{
  "instanceName": "Radarr",
  "eventType": "Download",
  "movie": {
    "title": "Inception",
    "year": 2010,
    "imdbId": "tt1375666"
  },
  "movieFile": {
    "quality": "Bluray-1080p"
  }
}
```

Supported Radarr event types in the formatter:
- Download
- MovieDelete
- Any other event type will be sent in a generic format

## Development
- Main entry: `app.js`
- Express server handles `POST /:type/:chatName` and passes payloads to message builders
- WhatsApp client: `whatsapp-web.js` with `LocalAuth` storing auth under `./auth_data`

To extend support for other *arrs (e.g., Sonarr):
- Add a new case in `buildMessage(body)` to detect `instanceName` (e.g., `case 'Sonarr':`) and implement a `buildSonarrMessage(eventType, series, episode, etc)` that formats the message.

## Troubleshooting
- Stuck on "WhatsApp client not ready yet": wait a few seconds after start, and make sure you scanned the QR code successfully. Delete `auth_data/` to force re-login if needed.
- "Authentication failed": as logged, delete `auth_data/` and restart to scan again.
- "Group/User not found":
  - For groups, ensure the exact name matches (case-sensitive) and you are a member.
  - For users, try the phone number (digits only) or confirm the contact name in WhatsApp matches exactly.
- Running in Docker and can’t see QR: `docker logs -f whatsapparr`.
- Puppeteer/Chromium missing libs: use the provided Dockerfile or install the listed packages on your host.
