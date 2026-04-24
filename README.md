# WhatsAppArr

Forward *Arrs webhook events to WhatsApp users or groups.

WhatsAppArr is a lightweight Express server that connects to WhatsApp via **baileys** and exposes simple HTTP endpoints
to send messages or receive webhook events. When your *arr apps (Radarr, Sonarr, etc.) send a webhook payload,
WhatsAppArr formats it and sends a notification to a specified WhatsApp JID (user or group).

> Note: Currently, the message builder includes templates mainly for Radarr events (Download, MovieDelete, generic).
> Support for other *arr apps can be added easily.

---

## Features

* QR-based WhatsApp login (multi-file auth, persisted in `auth_data/`)
* Webhook endpoint for *arr integrations
* Direct message sending via API
* Send messages to any WhatsApp JID (user or group)
* Automatic link preview generation
* i18n support via `Accept-Language` (English/Italian out of the box)
* List joined WhatsApp groups via API
* Docker or plain Node.js support

---

## Prerequisites

* Node.js 18+ (if running locally)
* A WhatsApp account
* Access to your *arr application(s) for webhook configuration

---

## Security and disclaimers

* This project uses an **unofficial API (baileys)** that automates WhatsApp Web. Use at your own risk.
* Authentication data is stored locally in `auth_data/`. Keep it private.
* Do not expose the API publicly without protection (reverse proxy, auth, firewall, etc.).

---

## Getting started

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd WhatsAppArr
```

---

### 2) Install dependencies

```bash
npm install
```

---

### 3) Run the server

```bash
node app.js
```

On first startup, a QR code will appear in the terminal.

Scan it via:
**WhatsApp → Linked Devices → Link a Device**

After login:

* Session is saved in `auth_data/`
* No need to scan again unless session expires or folder is deleted

---

### 4) Run with Docker

```bash
docker build -t whatsapparr .
```

```bash
docker run --name whatsapparr \
  -p 3000:3000 \
  -e PORT=3000 \
  -v "$(pwd)/auth_data:/app/auth_data" \
  whatsapparr
```

---

## Configuration

### Environment variables

* `PORT`: HTTP server port (default: `3000`)

### Important folders

* `auth_data/`: WhatsApp session (auto-created, must persist)

---

## API Endpoints

---

### 1) Webhook endpoint (*arr integration)

```
POST /webhook/:jid
```

#### Description

Receives webhook payloads and sends a formatted message to the specified WhatsApp JID.

#### Parameters

* `jid`: WhatsApp JID (e.g. `393XXXXXXXXX@s.whatsapp.net` or group ID)

#### Headers

```
Accept-Language: en | it
```

#### Body

Raw JSON from your *arr app.

#### Example

```
POST http://localhost:3000/webhook/393XXXXXXXXX@s.whatsapp.net
Content-Type: application/json
Accept-Language: it

{
  "instanceName": "Radarr",
  "eventType": "Download",
  "movie": {
    "title": "Inception",
    "year": 2010
  }
}
```

---

### 2) Direct message endpoint

```
POST /send
```

#### Description

Send a custom message directly.

#### Body

```json
{
  "jid": "393XXXXXXXXX@s.whatsapp.net",
  "message": "Hello from API"
}
```

You can also send structured messages:

```json
{
  "jid": "393XXXXXXXXX@s.whatsapp.net",
  "message": {
    "text": "Check this out https://example.com"
  }
}
```

#### Features

* Automatically detects URLs
* Generates link previews

---

### 3) List WhatsApp groups

```
GET /groups
```

#### Response

```json
[
  {
    "jid": "12345@g.us",
    "name": "My Group",
    "participants": 10
  }
]
```

---

## WhatsApp JID format

### Users

```
<phone>@s.whatsapp.net
```

Example:

```
393XXXXXXXXX@s.whatsapp.net
```

### Groups

```
<group-id>@g.us
```

Use `/groups` endpoint to retrieve them.

---

## Response codes

* `200` → Success
* `400` → Missing fields (`jid`, `message`)
* `503` → WhatsApp client not ready
* `500` → Internal error

---

## Link Preview Support

URLs in messages are automatically enriched with previews.

---

## i18n (Localization)

* Based on `Accept-Language` header
* Supported: `en`, `it`
* Fallback: `en`

---

## Development

### Main components

* `app.js` → Express server + WhatsApp connection
* `utils/messages/messages.js` → message builder
* `auth_data/` → session storage

---

### Extend message builder

Modify:

```js
buildMessage(req)
```

Based on:

* `req.body.instanceName`
* `req.body.eventType`

---

## Troubleshooting

### WhatsApp not ready

* Wait after startup
* Scan QR code
* Delete `auth_data/` if needed

---

### Logged out

Delete `auth_data/` and restart

---

### Cannot send message

* Check JID format
* Ensure group/user exists

---

### Docker logs

```bash
docker logs -f whatsapparr
```

---

## Notes

* Uses direct JID only (no name resolution)
* Designed for automation and reliability
