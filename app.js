const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('baileys');
const express = require('express');
const qrcode = require('qrcode-terminal');
const i18next = require("i18next");
const Backend = require("i18next-fs-backend/cjs");
const i18nextMiddleware = require("i18next-http-middleware/cjs");
const path = require("path");
const { buildMessage } = require('./utils/messages/messages');

const app = express();
app.use(express.json());

i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        fallbackLng: 'en',
        preload: ['en', 'it'],
        backend: {
            loadPath: path.join(__dirname, 'locales/{{lng}}/translation.json')
        },
        detection: { order: ['header'], caches: false },
        interpolation: { escapeValue: false }
    });

app.use(i18nextMiddleware.handle(i18next));

let sock = null;
let clientReady = false;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_data');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({ version, auth: state });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log('='.repeat(50));
            console.log('SCAN THIS QR CODE WITH WHATSAPP:');
            console.log('='.repeat(50));
            qrcode.generate(qr, { small: true });
            console.log('='.repeat(50));
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp client ready!');
            clientReady = true;
        }

        if (connection === 'close') {
            clientReady = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut) {
                console.log('❌ Logged out. Delete auth_data and try again.');
            } else {
                console.log(`❌ Disconnected (code ${statusCode}), reconnecting...`);
                connectToWhatsApp();
            }
        }
    });
}

app.post('/:type/:chatName', async (req, res) => {
    console.log('📡 Webhook received:', req.body);
    console.log('📋 URL parameters:', req.params);

    if (!clientReady) {
        return res.status(503).json({ error: 'WhatsApp client not ready yet' });
    }

    const { type, chatName } = req.params;
    const decodedChatName = Buffer.from(chatName, 'base64').toString('utf8');

    if (type !== 'group' && type !== 'user') {
        return res.status(400).json({ error: 'Type must be "group" or "user"' });
    }

    try {
        let targetJid = null;

        if (type === 'group') {
            const groups = await sock.groupFetchAllParticipating();
            const found = Object.entries(groups).find(([, meta]) => meta.subject === decodedChatName);
            if (found) targetJid = found[0];
        } else {
            const numericOnly = decodedChatName.replace(/\D/g, '');
            if (numericOnly) targetJid = `${numericOnly}@s.whatsapp.net`;
        }

        if (!targetJid) {
            return res.status(404).json({
                error: `${type === 'group' ? 'Group' : 'User'} "${decodedChatName}" not found`
            });
        }

        const message = buildMessage(req);
        const content = typeof message === 'string' ? { text: message } : message;

        await sock.sendMessage(targetJid, content);

        console.log(`✅ Notification sent → ${type}: ${decodedChatName}`);
        res.json({ success: true, message: 'Notification sent!', sentTo: decodedChatName, type });

    } catch (error) {
        console.error('❌ Error sending notification:', error);
        res.status(500).json({ error: error.message });
    }
});

connectToWhatsApp();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
