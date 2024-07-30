const axios = require('axios')
const { fetchJson, cmd, GIFBufferToVideoBuffer, sck } = require('../lib');
//---------------------------------------------------------------------------
cmd({
    pattern: "bite",
    alias: ['кусать', 'кусаю', 'укусить'],
    category: '🎭 Действия',
    desc: "укусить",
    priceMsg: 80,
    noPrefix: true,
    react: "😊"

}, async ({ Void, citel, users }) => {
    var bite = await fetchJson(`https://api.waifu.pics/sfw/bite`);
    const response = await axios.get(bite.url, {
        responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "utf-8");
    let gif = await GIFBufferToVideoBuffer(buffer);
    if (users) {
        let cap = `@${citel.sender.split("@")[0]} ${replies.bite()} @${users.split("@")[0]} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [users, citel.sender], caption: cap }, { quoted: citel });
    } else {
        let cap = `@${citel.sender.split("@")[0]} ${replies.biteSelf()}`;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [citel.sender], caption: cap }, { quoted: citel });
    }
});

cmd({
    pattern: "pat",
    alias: ["погладить", "гладить"],
    category: '🎭 Действия',
    desc: "гладить",
    priceMsg: 80,
    react: "😇",
}, async ({ Void, citel, users }) => {
    var bite = await fetchJson(`https://api.waifu.pics/sfw/pat`);
    const response = await axios.get(bite.url, {
        responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "utf-8");
    let gif = await GIFBufferToVideoBuffer(buffer);
    if (users) {
        let cap = `@${citel.sender.split("@")[0]} ${replies.pat()} @${users.split("@")[0]} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [users, citel.sender], caption: cap }, { quoted: citel });
    } else {
        let cap = `@${citel.sender.split("@")[0]} ${replies.patSelf()}`;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [citel.sender], caption: cap }, { quoted: citel });
    }
});

cmd({
    pattern: "kiss",
    alias: ["целовать", "поцеловать"],
    desc: "целовать",
    category: '🎭 Действия',
    priceMsg: 80,
    react: "😘",
}, async ({ Void, citel, users }) => {
    var bite = await fetchJson(`https://api.waifu.pics/sfw/kiss`);
    const response = await axios.get(bite.url, {
        responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "utf-8");
    let gif = await GIFBufferToVideoBuffer(buffer);
    if (users) {
        let cap = `@${citel.sender.split("@")[0]} ${replies.kiss()} @${users.split("@")[0]} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [users, citel.sender], caption: cap }, { quoted: citel });
    } else {
        let cap = `@${citel.sender.split("@")[0]} ${replies.kissSelf()}`;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [citel.sender], caption: cap }, { quoted: citel });
    }
});

cmd({
    pattern: "kill",
    alias: ["убить", "убил"],
    desc: "убить",
    category: '🎭 Действия',
    nsfw: true,
    priceMsg: 80,
    react: "😈",
}, async ({ Void, citel, users }) => {
    const checkNSFW = await sck.findOne({ id: citel.chat });
    if (citel.isGroup && !checkNSFW.nsfw) return citel.reply(replies.nsfwDisabled());

    var bite = await fetchJson(`https://api.waifu.pics/sfw/kill`);
    const response = await axios.get(bite.url, {
        responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "utf-8");
    let gif = await GIFBufferToVideoBuffer(buffer);
    if (users) {
        let cap = `@${citel.sender.split("@")[0]} ${replies.kill()} @${users.split("@")[0]}. `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [users, citel.sender], caption: cap }, { quoted: citel });
    } else {
        let cap = `@${citel.sender.split("@")[0]} ${replies.killSelf()}. `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [citel.sender], caption: cap }, { quoted: citel });
    }
});

cmd({
    pattern: "happy",
    alias: ["порадоваться", "радуюсь", "радоваться", "рада", "рад"],
    desc: "радоваться",
    category: '🎭 Действия',
    priceMsg: 80,
    react: "😎",
}, async ({ Void, citel, users }) => {
    var bite = await fetchJson(`https://api.waifu.pics/sfw/dance`);
    const response = await axios.get(bite.url, {
        responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "utf-8");

    let gif = await GIFBufferToVideoBuffer(buffer);
    if (users) {
        let cap = `@${citel.sender.split("@")[0]} ${replies.happy()} @${users.split("@")[0]} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [users, citel.sender], caption: cap }, { quoted: citel });
    } else {
        let cap = `@${citel.sender.split("@")[0]} ${replies.happySelf()} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [citel.sender], caption: cap }, { quoted: citel });
    }
});

cmd({
    pattern: "dance",
    alias: ['танцевать', 'потанцевать'],
    desc: "танцевать",
    category: '🎭 Действия',
    priceMsg: 80,
    react: "💀",
}, async ({ Void, citel, users }) => {
    var bite = await fetchJson(`https://api.waifu.pics/sfw/dance`);
    const response = await axios.get(bite.url, {
        responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "utf-8");

    let gif = await GIFBufferToVideoBuffer(buffer);
    if (users) {
        let cap = `@${citel.sender.split("@")[0]} ${replies.dance()} @${users.split("@")[0]} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [users, citel.sender], caption: cap }, { quoted: citel });
    } else {
        let cap = `@${citel.sender.split("@")[0]} ${replies.danceSelf()} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [citel.sender], caption: cap }, { quoted: citel });
    }
});

cmd({
    pattern: "hug",
    alias: ["обнять"],
    desc: "обнимать",
    category: '🎭 Действия',
    priceMsg: 80,
    react: "🤗",
}, async ({ Void, citel, users }) => {
    var bite = await fetchJson(`https://api.waifu.pics/sfw/cuddle`);
    const response = await axios.get(bite.url, {
        responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "utf-8");
    let gif = await GIFBufferToVideoBuffer(buffer);
    if (users) {
        let cap = `@${citel.sender.split("@")[0]} ${replies.hug()} @${users.split("@")[0]} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [users, citel.sender], caption: cap }, { quoted: citel });
    } else {
        let cap = `@${citel.sender.split("@")[0]} ${replies.hugSelf()} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [citel.sender], caption: cap }, { quoted: citel });
    }
});
//----------------------------------------------------------------------------------
cmd({
    pattern: "blowjob",
    alias: ["минет", "."],
    desc: "минет",
    category: '🎭 Действия',
    priceMsg: 120,
    nsfw: true,
    react: "🥰",
}, async ({ Void, citel, users }) => {
    const checkNSFW = await sck.findOne({ id: citel.chat });
    if (citel.isGroup && !checkNSFW.nsfw) return citel.reply(replies.nsfwDisabled());

    var bite = await fetchJson(`https://api.waifu.pics/nsfw/blowjob`);
    const response = await axios.get(bite.url, {
        responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "utf-8");

    let gif = await GIFBufferToVideoBuffer(buffer);
    if (users) {
        let cap = `@${citel.sender.split("@")[0]} ${replies.minet()} @${users.split("@")[0]} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [users, citel.sender], caption: cap }, { quoted: citel });
    } else {
        let cap = `@${citel.sender.split("@")[0]} ${replies.minetSelf()}`;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [citel.sender], caption: cap }, { quoted: citel });
    }
})
//------------------------------------------------------------------------------
cmd({
    pattern: "fuck",
    alias: ["выебать", "выебал"],
    desc: "выебать кого-нибудь",
    category: '🎭 Действия',
    priceMsg: 120,
    nsfw: true,
    react: "🥵",
}, async ({ Void, citel, users }) => {
    //-------Вкл/Выкл
    const checkNSFW = await sck.findOne({ id: citel.chat });
    if (citel.isGroup && !checkNSFW.nsfw) return citel.reply(replies.nsfwDisabled());
    //-------Выполнение
    var bite = await fetchJson(`https://api.waifu.pics/nsfw/trap`);
    const response = await axios.get(bite.url, {
        responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "utf-8");

    let gif = await GIFBufferToVideoBuffer(buffer);
    if (users) {
        let cap = `@${citel.sender.split("@")[0]} ${replies.viebat()} @${users.split("@")[0]} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [users, citel.sender], caption: cap }, { quoted: citel });
    } else {
        let cap = `@${citel.sender.split("@")[0]} ${replies.viebatSelf()} `;
        await Void.sendMessage(citel.chat, { video: gif, gifPlayback: true, mentions: [citel.sender], caption: cap }, { quoted: citel });
    }
})

cmd({
    pattern: "custom",
    alias: ["кастом"],
    desc: "кастом действие",
    category: '🎭 Действия',
    priceMsg: 85,
}, async ({ Void, citel, text, users }) => {
    if (!text) return citel.reply(replies.notText({ text: 'custom' }))
    await Void.sendMessage(citel.chat, {
        text: `*@${citel.sender.split('@')[0]}* ${text} *@${users.split('@')[0]}*`,
        mentions: [citel.sender, users]
    }, { quoted: citel })
})

cmd({
    pattern: "me",
    alias: ["ми", "я"],
    desc: "действие от 1 лица",
    category: '🎭 Действия',
    priceMsg: 80,
}, async ({ Void, citel, text, users }) => {
    if (!text) return citel.reply(replies.notText({ text: 'me' }))
    await Void.sendMessage(citel.chat, {
        text: `*@${citel.sender.split('@')[0]}* ${text}`,
        mentions: [citel.sender, users]
    }, { quoted: citel })
})

cmd({
    pattern: "do",
    alias: ["ду", 'делать', 'сделать'],
    desc: "дейстиве от 3 лица",
    category: '🎭 Действия',
    priceMsg: 80,
}, async ({ Void, citel, text, users }) => {
    if (!text) return citel.reply(replies.notText({ text: 'do' }))
    await Void.sendMessage(citel.chat, {
        text: `${text} (*@${citel.sender.split('@')[0]}*)`,
        mentions: [citel.sender, users]
    }, { quoted: citel })
})