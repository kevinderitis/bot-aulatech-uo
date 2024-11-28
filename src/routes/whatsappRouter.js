import pkg from 'whatsapp-web.js';
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { createLead, getLeadByChatId, getGroupId, updateStage } from '../dao/leadDAO.js';
import messages from '../crons/messages/messages.js';

const { Client, LocalAuth, MessageMedia } = pkg;
const whatsappRouter = Router();

const unavailableSenders = new Set();

let client = new Client({
    authStrategy: new LocalAuth({ clientId: `client-0206` }),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        // executablePath: process.env.CHROME_BIN || null
    },
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014587000-alpha.html",
    },
});

let qrData;

export const initializeClient = () => {
    client.on('qr', async (qr) => {
        qrData = qr;
        console.log(`Este es la data de qr: ${qrData}`);
    });

    client.on('ready', async () => {
        console.log('Client is ready!');
        qrData = null;
    });

    client.on('disconnected', async (reason) => {
        console.log('Cliente desconectado:', reason);
    });

    client.on('group_join', async (notification) => {
        const chatId = notification.id.remote;
        const user = notification.recipientIds[0];
        await sendMessageUnofficial(user, messages.welcomeGroup);
        await updateStage(user, 1);
        console.log(`Usuario ${user} se unió al grupo ${chatId}`);
    });

    client.on('group_leave', async (notification) => {
        const chatId = notification.id.remote;
        const user = notification.recipientIds[0];
        await sendMessageUnofficial(user, messages['out-of-group']);
        await updateStage(user, 'waiting-group');
        console.log(`Usuario ${user} salió o fue eliminado del grupo ${chatId}`);
    });

    function extractPhoneNumber(messageBody) {
        const regex = /\d{10,}/;
        const match = messageBody.match(regex);
        return match ? match[0] : null;
    }

    client.on('message', async (message) => {
        try {
            const messageText = message.body;
            const sender = message.from;

            console.log(`Numero de telefono: ${sender}`);
            console.log(`Mensaje: ${messageText}`);

            const lead = await getLeadByChatId(sender);
            if (!lead) {
                console.log(`El sender ${sender} no esta registrado.`);
                await createLead(sender);
                await sendMessageUnofficial(sender, messages.welcome);
                // return;
            }


            if (message.from && !unavailableSenders.has(sender) && messageText) {
                console.log('Available sender')
                unavailableSenders.add(sender);

                // await sendMessageUnofficial(sender, messages.welcome);
                console.log('no envia nada por ahora');

                unavailableSenders.delete(sender);
            } else {
                console.log('Unavailable sender');
            }


        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    client.initialize();
};

whatsappRouter.get('/qr', async (req, res) => {
    try {
        res.render('qr-code', { qrText: qrData });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating QR code');
    }
});

whatsappRouter.get('/shutdown', async (req, res) => {
    try {
        await client.destroy();
        console.log('Client has been shut down');

        setTimeout(() => {
            initializeClient();
            console.log('Client has been restarted');
        }, 2000);

        res.send('Client has been restarted');
    } catch (error) {
        console.error('Error shutting down client:', error);
        res.status(500).send('Error shutting down client');
    }
});

const getRandomTypingTime = () => {
    const min = 5000;
    const max = 10000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const sendMessageUnofficial = async (to, message, mediaUrl) => {
    try {
        if (!to || !message) {
            throw new Error('El destinatario y el mensaje son obligatorios.');
        }

        const typingTime = getRandomTypingTime();
        const chat = await client.getChatById(to);

        if (chat) {
            await client.sendPresenceAvailable();
            await chat.sendStateTyping();

            await new Promise(resolve => setTimeout(resolve, typingTime));

            await chat.clearState();
            await client.sendPresenceUnavailable();

        } else {
            console.log('Chat id no encontrado.');
        }

        if (mediaUrl) {
            // const mediaData = await fetch(mediaUrl).then(response => response.buffer());
            const mediaData = fs.readFileSync(mediaUrl);
            const base64 = mediaData.toString('base64');
            const mimeType = 'image/jpeg';

            const mediaMessage = new MessageMedia(mimeType, base64);

            await client.sendMessage(to, mediaMessage, { caption: message });
        } else {
            await client.sendMessage(to, message);
        }

        console.log('Mensaje enviado con éxito.');
    } catch (error) {
        console.error('Error enviando el mensaje:', error);
    }
};

export const checkIfUserInGroup = async (idGroup, userId) => {
    try {
        let groupId = idGroup ? idGroup : await getGroupId();
        const group = await client.getChatById(groupId);

        const participants = await group.getParticipants();

        const isUserInGroup = participants.some(participant => participant.id === userId);

        return isUserInGroup;
    } catch (error) {
        console.error('Error al verificar si el usuario está en el grupo:', error);
        return false;
    }
};

export default whatsappRouter;