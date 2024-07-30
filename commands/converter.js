const { sck1, cmd, getBuffer, runAnimation, stopAnimation, sendRequestGPT } = require('../lib');
const eco = require('../lib/economyFunction/msgFunc.js');
const { exec } = require('child_process');
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const fs = require('fs');
const axios = require('axios');
//----------------------------- Text to Sticker ------------------------------
cmd({
    pattern: "q",
    alias: ["цс"],
    desc: "из сообщения в стикер",
    category: "🤖 Конвертер",
    level: 21,
    priceMsg: 450,
    isCreator: true
}, async ({ Void, citel, text }) => {
    if (!citel.quoted) return
    runAnimation(citel);
    let textt = citel.quoted.text;
    let pfp;
    try {
        pfp = await Void.profilePictureUrl(citel.quoted.sender, "image");
    } catch (e) {
        pfp = THUMB_IMAGE;
    }
    let todlinkf = ["#FFFFFF", "#000000"];
    let todf = todlinkf[Math.floor(Math.random() * todlinkf.length)];
    let username = await sck1.findOne({ id: citel.quoted.sender });
    let tname = (username.name && username.name !== undefined) ? username.name : Void.getName(citel.quoted.sender);
    let body = {
        type: "quote",
        format: "png",
        backgroundColor: todf,
        width: 512,
        height: 512,
        scale: 3,
        messages: [{
            avatar: true,
            from: {
                first_name: tname,
                language_code: "en",
                name: tname,
                photo: {
                    url: pfp,
                },
            },
            text: textt,
            replyMessage: {},
        }],
    };
    let res = await axios.post("https://bot.lyo.su/quote/generate", body);
    let img = Buffer.alloc(res.data.result.image.length, res.data.result.image, "base64");
    stopAnimation()
    citel.react('✅')
    citel.reply(img, { packname: 'Secktor', author: 'Quotely' }, "sticker");
});
//----------------------------- Steal Sticker ------------------------------
cmd({
    pattern: "s",
    alias: ["стикер", "с", "sticker"],
    category: "🤖 Конвертер",
    desc: "сделать стикер",
    alias: ["украсть"],
    priceMsg: "150 - фото, 550 - видео",
    level: 21,
}, async ({ Void, citel, text }) => {
    runAnimation(citel);
    try {
        const MAX_QUALITY = 100;
        const MIN_QUALITY = 1;
        const TARGET_SIZE = 1024 * 1024; // 1 MB in bytes

        async function checkStickerSize(media, pack, author, quality, text) {
            let sticker = new Sticker(media, {
                pack: pack,
                author: author,
                type: text.includes("--crop") || text.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
                categories: ["🤩", "🎉"],
                id: "12345",
                quality: quality,
                background: "transparent",
            });

            const buffer = await sticker.toBuffer();
            return buffer.length;
        }

        async function binarySearchQuality(media, pack, author, text) {
            let left = MIN_QUALITY;
            let right = MAX_QUALITY;
            let quality = 0;

            while (left <= right) {
                let mid = Math.floor((left + right) / 2);
                let size = await checkStickerSize(media, pack, author, mid, text);

                if (size === TARGET_SIZE) {
                    quality = mid;
                    break;
                } else if (size < TARGET_SIZE) {
                    left = mid + 1;
                    quality = mid;
                } else {
                    right = mid - 1;
                }
            }

            return quality;
        }

        if (citel.quoted) {
            const mime = citel.quoted.mtype;
            const cost = mime === 'videoMessage' ? 550 : 150;
            await eco.takeMsg({ jid: citel.quoted.sender, amount: cost });

            let media = await citel.quoted.download();

            let pack;
            let author;
            if (text) {
                anu = text.split("|");
                pack = anu[0] !== "" ? anu[0] : citel.pushName + '♥️';
                author = anu[1] !== "" ? anu[1] : 'Воробушек';
            } else {
                pack = citel.pushName;
                author = "♥️";
            }

            const quality = await binarySearchQuality(media, pack, author, text);

            let sticker = new Sticker(media, {
                pack: pack,
                author: author,
                type: text.includes("--crop") || text.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
                categories: ["🤩", "🎉"],
                id: "12345",
                quality: quality,
                background: "transparent",
            });

            const buffer = await sticker.toBuffer();
            await Void.sendMessage(citel.chat, { sticker: buffer }, { quoted: citel });
            stopAnimation()
            citel.react('✅')
        }
    } catch (e) {
        console.log(e)
        stopAnimation()
        citel.react("❌")
    }
});
//----------------------------- Sticker to Photo ------------------------------
cmd({
    pattern: "photo",
    alias: ["фото"],
    category: "💎 VIP",
    isVip: true,
    react: "⏳",
    desc: "из стикера в фото/видео",
}, async ({ Void, citel, text }) => {
    const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`;
    if (!citel.quoted) return citel.reply(replies.notPQuoted());
    const mime = citel.quoted.mtype;
    if (mime !== "imageMessage" && mime !== "stickerMessage") return citel.reply(replies.error());
    runAnimation(citel)

    let media = await Void.downloadAndSaveMediaMessage(citel.quoted);
    let name = await getRandom('.png');
    exec(`ffmpeg -i ${media} ${name}`, async (err) => {
        let buffer = fs.readFileSync(media);
        citel.react('✅')
        await Void.sendMessage(citel.chat, { image: buffer }, { quoted: citel });
        stopAnimation();
        fs.unlink(media, () => { })
        fs.unlink(name, () => { })
    });
});
//----------------------------- View Once Message Retrieval ------------------------------
cmd({
    pattern: "vv",
    alias: ['viewonce', 'retrive', 'чит', 'посмотреть'],
    category: "💎 VIP",
    isVip: true,
    desc: "просмотреть повторно сообщение в однократном просмотре",
}, async ({ Void, citel, text }) => {
    try {
        if (citel.quoted) {
            runAnimation(citel)
            if (citel.quoted.message?.imageMessage) {
                let cap = citel.quoted.message.imageMessage.caption;
                let anu = await Void.downloadAndSaveMediaMessage(citel.quoted.message.imageMessage);
                stopAnimation()
                if (citel.isGroup) {
                    await Void.sendMessage(citel.chat, { image: { url: anu }, caption: cap }, { quoted: citel });
                } else {
                    await Void.sendMessage(citel.sender, { image: { url: anu }, caption: cap }, { quoted: citel });
                }
                return fs.unlink(anu, () => { })
            } else if (citel.quoted.message?.videoMessage) {
                let cap = citel.quoted.message.videoMessage.caption;
                let anu = await Void.downloadAndSaveMediaMessage(citel.quoted.message.videoMessage);
                stopAnimation()
                citel.react('✅')
                if (citel.isGroup) {
                    await Void.sendMessage(citel.chat, { video: { url: anu }, caption: cap }, { quoted: citel });
                } else {
                    await Void.sendMessage(citel.sender, { video: { url: anu }, caption: cap }, { quoted: citel });
                }
                return fs.unlink(anu, () => { })
            } else if (citel.quoted.message?.audioMessage) {
                let audioq = await Void.downloadAndSaveMediaMessage(citel.quoted.message.audioMessage);
                stopAnimation()
                citel.react('✅')
                if (citel.isGroup) {
                    await Void.sendMessage(citel.chat, { audio: { url: audioq } }, { quoted: citel })
                } else {
                    await Void.sendMessage(citel.sender, { audio: { url: audioq } }, { quoted: citel })
                }
                return fs.unlink(anu, () => { })
            } else {
                stopAnimation()
                citel.reply('Отметь сообщение в однократном просмотре')
            }
        }
    } catch (e) {
        stopAnimation()
        console.log("error", e);
    }
});
//----------------------------- Animated Text to Sticker ------------------------------
cmd({
    pattern: "attp",
    alias: ["аттп"],
    priceMsg: 12,
    category: "🤖 Конвертер",
    desc: "слово в анимированный стикер",
    react: "⏳"
}, async ({ Void, citel, text }) => {
    let russianLetters = /[a-zA-Z]/;
    if (!russianLetters.test(text)) return citel.reply(replies.notATTPEnglisch());

    await citel.reply(replies.process());
    let media = await getBuffer(`https://api.lolhuman.xyz/api/attp?apikey=GataDios&text=${text}`);
    let patternn = '11';
    let sticker = new Sticker(media, {
        pack: 'Secktor Russia',
        author: patternn,
        type: StickerTypes.FULL,
        categories: ["🤩", "🎉"],
        id: "12345",
        quality: 70,
        background: "transparent",
    });
    const stikk = await sticker.toBuffer();
    citel.react('✅')
    await Void.sendMessage(citel.chat, { sticker: stikk }, { quoted: citel });
});

//----------------------------- Text to Static Sticker ------------------------------
cmd({
    pattern: "ttp",
    alias: ["ттп"],
    category: "🤖 Конвертер",
    desc: "слово в стикер",
    priceMsg: 12,
    react: "⏳"
}, async ({ Void, citel, text }) => {
    let russianLetters = /[a-zA-Z]/;
    if (!russianLetters.test(text)) return citel.reply(replies.notTTPEnglisch());

    citel.reply(replies.process());
    let media = await getBuffer(`https://api.lolhuman.xyz/api/ttp?apikey=GataDios&text=${text}`);
    let patternn = '111';
    let sticker = new Sticker(media, {
        pack: 'Secktor',
        author: patternn,
        type: StickerTypes.FULL,
        categories: ["🤩", "🎉"],
        id: "12345",
        quality: 70,
        background: "transparent",
    });
    const stikk = await sticker.toBuffer();
    citel.react('✅')
    await Void.sendMessage(citel.chat, { sticker: stikk }, { quoted: citel });
});

cmd({
    pattern: "stt",
    category: "💎 VIP",
    desc: "аудио в текст",
    isVip: true
}, async ({ Void, citel }) => {
    if (citel.quoted.mimetype !== 'audio/ogg; codecs=opus') return citel.reply('Переводить в текст можно только голосовые сообщения')
    citel.react('⏳')
    let audioq = await Void.downloadAndSaveMediaMessage(citel.quoted);
    const result = await sendRequestGPT({ prompt: audioq, ver: "speech" })
    if (citel.isGroup) {
        citel.reply(result)
    } else {
        await Void.sendMessage(citel.sender, { text: result }, { quoted: citel })
    }
    citel.react('✅')
}) 