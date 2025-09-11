const { Client, LocalAuth } = require('whatsapp-web.js');
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
    detection: {
      order: ['header'],
      caches: false
    },
    interpolation: { escapeValue: false }
  });

app.use(i18nextMiddleware.handle(i18next));

let clientReady = false;

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './auth_data' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('='.repeat(50));
    console.log('SCAN THIS QR CODE WITH WHATSAPP:');
    console.log('='.repeat(50));
    qrcode.generate(qr, { small: true });
    console.log('='.repeat(50));
});

client.on('ready', () => {
    console.log('✅ WhatsApp client ready!');
    clientReady = true;
});

client.on('auth_failure', () => {
    console.log('❌ Authentication failed, delete auth_data and try again');
});

client.on('disconnected', (reason) => {
    console.log('❌ Client disconnected:', reason);
    clientReady = false;
});

app.post('/:type/:chatName', async (req, res) => {
    console.log('📡 Webhook received:', req.body);
    console.log('📋 URL parameters:', req.params);

    if (!clientReady) {
        return res.status(503).json({
            error: 'WhatsApp client not ready yet'
        });
    }

    const { type, chatName } = req.params;

    const decodedChatName = Buffer.from(chatName, 'base64').toString('utf8');

    if (type !== 'group' && type !== 'user') {
        return res.status(400).json({
            error: 'Type must be "group" or "user"'
        });
    }

    try {
        const chats = await client.getChats();
        let targetChat;

        if (type === 'group') {
            targetChat = chats.find(chat =>
                chat.isGroup && chat.name === decodedChatName
            );
        } else {
            targetChat = chats.find(chat =>
                !chat.isGroup && (
                    chat.name === decodedChatName ||
                    chat.id.user === decodedChatName.replace(/\D/g, '')
                )
            );
        }

        if (!targetChat) {
            return res.status(404).json({
                error: `${type === 'group' ? 'Group' : 'User'} "${decodedChatName}" not found`
            });
        }

        const message = buildMessage(req);

        await client.sendMessage(targetChat.id._serialized, message, { "linkPreview": true });

        console.log(`✅ Notification sent for → ${type}: ${decodedChatName}`);

        res.json({
            success: true,
            message: 'Notification sent!',
            sentTo: decodedChatName,
            type: type
        });
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        res.status(500).json({ error: error.message });
    }
});

client.initialize();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
