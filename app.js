const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    getUrlInfo
} = require('baileys');
const express = require('express');
const qrcode = require('qrcode-terminal');
const i18next = require("i18next");
const Backend = require("i18next-fs-backend/cjs");
const i18nextMiddleware = require("i18next-http-middleware/cjs");
const path = require("path");
const {buildMessage} = require('./utils/messages/messages');

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
        detection: {order: ['header'], caches: false},
        interpolation: {escapeValue: false}
    });

app.use(i18nextMiddleware.handle(i18next));

let sock = null;
let clientReady = false;

async function connectToWhatsApp() {
    const {state, saveCreds} = await useMultiFileAuthState('./auth_data');
    const {version} = await fetchLatestBaileysVersion();

    sock = makeWASocket({version, auth: state, generateHighQualityLinkPreview: true});

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({connection, lastDisconnect, qr}) => {
        if (qr) {
            console.log('='.repeat(50));
            console.log('SCAN THIS QR CODE WITH WHATSAPP:');
            console.log('='.repeat(50));
            qrcode.generate(qr, {small: true});
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

async function sendMessage(jid, message) {
    const text = typeof message === 'string' ? message : message?.text;
    const urlMatch = text?.match(/https?:\/\/[^\s]+/);

    let content = typeof message === 'string' ? {text: message} : message;

    if (urlMatch) {
        try {
            const linkPreview = await getUrlInfo(urlMatch[0], {
                thumbnailWidth: 1024,
                fetchOpts: {timeout: 8000},
                uploadImage: sock.waUploadToServer,
            });
            content = {...content, linkPreview};
        } catch (e) {
            console.warn('⚠️ Link preview failed:', e.message);
        }
    }

    return sock.sendMessage(jid, content);
}

app.post('/webhook/:jid', async (req, res) => {
    console.log('📡 Webhook received:', req.body);
    console.log('📋 URL parameters:', req.params);

    if (!clientReady) {
        return res.status(503).json({error: 'WhatsApp client not ready yet'});
    }

    const {jid} = req.params;

    try {
        const message = buildMessage(req);
        await sendMessage(jid, message);

        console.log(`✅ Notification sent → ${jid}`);
        res.json({success: true, message: 'Notification sent!', sentTo: jid});

    } catch (error) {
        console.error('❌ Error sending notification:', error);
        res.status(500).json({error: error.message});
    }
});


app.post('/send', async (req, res) => {
    console.log('📡 Direct send received:', req.body);

    if (!clientReady) {
        return res.status(503).json({error: 'WhatsApp client not ready yet'});
    }

    const {jid, message} = req.body;

    if (!jid || !message) {
        return res.status(400).json({error: 'Fields "jid" and "message" are required'});
    }

    try {
        await sendMessage(jid, message);

        console.log(`✅ Direct message sent → ${jid}`);
        res.json({success: true, message: 'Message sent!', sentTo: jid});

    } catch (error) {
        console.error('❌ Error sending direct message:', error);
        res.status(500).json({error: error.message});
    }
});

app.get('/groups', async (req, res) => {
    if (!clientReady) return res.status(503).json({error: 'Client not ready'});

    try {
        const groups = await sock.groupFetchAllParticipating();
        const list = Object.entries(groups).map(([jid, meta]) => ({
            jid,
            name: meta.subject,
            participants: meta.participants.length
        }));
        res.json(list);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

connectToWhatsApp();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
