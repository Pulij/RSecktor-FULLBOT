const { cmd, getBuffer, runAnimation, stopAnimation } = require('../lib');
const fs = require('fs');
const ytdl = require("@distube/ytdl-core");
const axios = require('axios');
const yts = require('yt-search')
//-----------------------------------------------------------------------------------
cmd({
    pattern: "tts",
    alias: ["ттс"],
    desc: "текст в речь",
    category: "⭐ Переводчик",
    level: 10,
    priceMsg: 170,
}, async ({ Void, citel, text }) => {
    try {
        if (!text) return citel.reply(replies.notText({ text: 'tts' }));
        runAnimation(citel);

        // Получение IAM токена
        const res = await axios.post('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
            yandexPassportOauthToken: 'y0_AgAAAABaeIcpAATuwQAAAAEDJWX4AAD-aBmeFoFHfrgLN9UU9rgppcCujQ'
        });

        const FOLDER_ID = "b1gr6ioajp8k1euqr75r";
        const IAM_TOKEN = res.data.iamToken;

        // Конфигурация для синтеза речи
        const data = {
            model: "",
            hints: [{
                voice: "zahar",
                speed: 1.0,
                volume: 1.0,
                role: "neutral",
            }],
            outputAudioSpec: {
                containerAudio: {
                    containerAudioType: "MP3"
                }
            },
            loudnessNormalizationType: "LUFS",
            unsafeMode: true,
            text: text
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${IAM_TOKEN}`,
            'x-folder-id': FOLDER_ID
        };

        const response = await axios.post('https://tts.api.cloud.yandex.net/tts/v3/utteranceSynthesis', data, { headers });
        const audioData = response.data;
        const mp3Buffer = Buffer.from(audioData.result.audioChunk.data, 'base64');

        await Void.sendMessage(citel.chat, {
            audio: mp3Buffer,
            mimetype: "audio/mp4",
            ptt: true
        }, { quoted: citel });

        stopAnimation();
        citel.react('✅');
    } catch (e) {
        console.error('Ошибка:', e);
        stopAnimation();
        citel.react('❌');
    }
});
//---------------------------------------------------------------------------
cmd({
    pattern: "ytmp4",
    alias: ["видео", "мп4", "итмп4"],
    desc: "видео с YouTube",
    category: "🎙️ Загрузки",
    level: 14,
    priceMsg: 70,
}, async ({ Void, citel, text }) => {
    try {
        let search = await yts(text);
        let anu = search.videos[0];
        if (!anu) return citel.reply(replies.notVideo());

        let infoYt = await ytdl.getInfo(anu.url);
        let titleYt = infoYt.videoDetails.title;
        let buttonMessaged = {
            text: '1080p',
            contextInfo: {
                externalAdReply: {
                    title: 'SeckVideo',
                    body: titleYt,
                    thumbnailUrl: `https://w.forfun.com/fetch/7a/7a990de723f9b21bfe1d4095a4471498.jpeg`,
                    mediaType: 2,
                    mediaUrl: anu.url,
                },
            },
        };

        citel.react('✅');
        await Void.sendMessage(citel.chat, buttonMessaged, { quoted: citel });
    } catch (e) {
        console.error('Ошибка:', e);
        citel.react('❌');
    }
});
//---------------------------------------------------------------------------
cmd({
    pattern: "ytmp3",
    alias: ["мп3", "аудио", "итмп3"],
    desc: "аудио с YouTube",
    category: "🎙️ Загрузки",
    level: 14,
    priceMsg: 70
}, async ({ Void, citel, text }) => {
    const getRandomFileName = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`;
    try {
        let search = await yts(text);
        let video = search.videos[0];
        let urlYt = video.url;
        let infoYt = await ytdl.getInfo(urlYt);
        let titleYt = infoYt.videoDetails.title;
        let randomName = getRandomFileName(".mp3");
        let filePath = `./${randomName}`;
        const ytdlOptions = {
            filter: (info) => info.audioBitrate === 128 || info.audioBitrate === 140,
        };

        const stream = ytdl(urlYt, ytdlOptions);
        const writeStream = fs.createWriteStream(filePath);

        stream.pipe(writeStream);

        writeStream.on('finish', async () => {
            let stats = fs.statSync(filePath);
            let fileSizeInBytes = stats.size;
            let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
            if (fileSizeInMegabytes <= 100) {  // Changed to 100MB instead of dlsize variable
                let buttonMessage = {
                    audio: fs.readFileSync(filePath),
                    mimetype: 'audio/mpeg',
                    fileName: `${titleYt}.mp3`,
                    headerType: 4,
                    contextInfo: {
                        externalAdReply: {
                            title: titleYt,
                            body: citel.pushName,
                            renderLargerThumbnail: true,
                            thumbnailUrl: video.thumbnail,
                            mediaUrl: urlYt,
                            mediaType: 1,
                            thumbnail: await getBuffer(video.thumbnail),
                            sourceUrl: urlYt,
                        },
                    },
                };
                await Void.sendMessage(citel.chat, buttonMessage, { quoted: citel });
                fs.unlinkSync(filePath);
            } else {
                console.log('File is too large');
            }

            await citel.react('✅');
        });

        stream.on('error', (err) => {
            console.error('Stream Error:', err);
            throw err;
        });

        writeStream.on('error', (err) => {
            console.error('Write Stream Error:', err);
            throw err;
        });

    } catch (e) {
        console.error('Error:', e);
        await citel.react('❌');
    }
});