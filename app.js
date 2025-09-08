const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

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

        const message = buildMessage(req.body);

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

function buildMessage(body) {
    const { instanceName, eventType } = body;
    if (eventType === "Test") {
        return `✅ Test notification from ${instanceName}.\n\n` +
            `Everything is working fine! 🚀`;
    }

    switch (instanceName) {
        case 'Radarr':
            const { movie, movieFile } = body;
            return buildRadarrMessage(eventType, movie, movieFile)
    }
}

function buildRadarrMessage(eventType, movie, movieFile) {
    const movieTitle = movie?.title || 'Unknown movie';
    const movieYear = movie?.year ? ` (${movie.year})` : '';
    const quality = movieFile?.quality || 'Unknown quality';
    const link = movie?.imdbId ? `https://www.imdb.com/title/${movie.imdbId}/` : 'Unknown link';

    switch (eventType) {
        case 'Download':
            return `🎬 New movie downloaded!\n\n` +
                `🎞️ Title: ${movieTitle}${movieYear}\n` +
                `📺 Quality: ${quality}\n\n` +
                `🔗 Info: ${link}\n\n` +
                `Enjoy watching! 🍿`;

        case 'MovieDelete':
            return `🗑️ Movie deleted!\n\n` +
                `🎞️ Title: ${movieTitle}${movieYear}\n` +
                `📺 Quality: ${quality}\n\n` +
                `🔗 Info: ${link}`;

        default:
            return `ℹ️ Event received: ${eventType}\n\n` +
                `🎞️ Title: ${movieTitle}${movieYear}\n` +
                `📺 Quality: ${quality}\n\n` +
                `🔗 Info: ${link}`;
    }
}


client.initialize();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
