const os = require('os');
const fs = require('fs');
const { cmd, runtime, sck, sck1, getSessionList } = require('../lib/index.js');
const eco = require('../lib/economyFunction/msgFunc.js');
//=========================================Обмен валюты
cmd({
    pattern: "setmsg",
    alias: ["сетмсг", "установить мсг"],
    category: "admins",
    desc: "установить определенное количество msg",
    isCreator: true,
    users: true,
    react: "💷"
}, async ({ Void, citel, text, users }) => {
    eco.setMsg({ jid: users, amount: parseInt(text.split(' ')[0]) })
    await Void.sendMessage(citel.chat, { text: replies.setMsg({ msg: parseInt(text.split(' ')[0]), jid: users.split('@')[0] }), mentions: [users] }, { quoted: citel });
})

//giveMsg
cmd({
    pattern: "givemsg",
    alias: ["датьмсг"],
    category: "admins",
    desc: 'выдать определенное количество msg',
    isCreator: true,
    users: true,
}, async ({ Void, citel, text, users }) => {
    eco.giveMsg({ jid: users, amount: parseInt(text.split(' ')[0]) })
    await Void.sendMessage(citel.chat, { text: replies.giveMsg({ msg: parseInt(text.split(' ')[0]), jid: users.split('@')[0] }), mentions: [users] }, { quoted: citel });
})

//setLvl
cmd({
    pattern: "setlvl",
    desc: "установить определенный уровень",
    category: "admins",
    isCreator: true,
    users: true
}, async ({ Void, citel, text, users }) => {
    eco.setLvl({ jid: users, amount: parseInt(text.split(' ')[0]) })
    await Void.sendMessage(citel.chat, { text: replies.setLvl({ lvl: parseInt(text.split(' ')[0]), jid: users.split('@')[0], mentions: [users] }, { quoted: citel }) })
})

//giveLvl
cmd({
    pattern: "givelvl",
    desc: 'выдать определенное количество уровней',
    category: "admins",
    isCreator: true,
    users: true
}, async ({ Void, citel, text, users }) => {
    eco.giveLvl({ jid: users, amount: parseInt(text.split(' ')[0]) })
    await Void.sendMessage(citel.chat, { text: replies.giveLvl({ lvl: parseInt(text.split(' ')[0]), jid: users.split('@')[0], mentions: [users] }, { quoted: citel }) })
})
//takeLvl
cmd({
    pattern: "takelvl",
    desc: "забрать определенное количество уровней",
    category: "admins",
    isCreator: true,
    users: true
}, async ({ Void, citel, text, users }) => {
    const user = await sck1.findOne({ id: citel.sender })
    const q = await sck1.findOne({ id: users })
    if ((q.infoRoleUsers.role === 'isAdminsBot' || q.infoRoleUsers.role === 'isCreator') && (user.infoRoleUsers.role === 'isAdminsBot' || user.infoRoleUsers.role === 'isCreator')) return citel.reply('[ error: forbidden ]')
    eco.takeLvl({ jid: users, amount: parseInt(text.split(' ')[0]) })
    await Void.sendMessage(citel.chat, { text: replies.takeLvl({ lvl: parseInt(text.split(' ')[0]), jid: users.split('@')[0], mentions: [users] }, { quoted: citel }) })
})

//takeMsg
cmd({
    pattern: "takemsg",
    alias: ["забратьмсг"],
    desc: "забрать определенное количество msg",
    category: "admins",
    isCreator: true,
    users: true,
    react: "💷"
}, async ({ Void, citel, text, users }) => {
    const user = await sck1.findOne({ id: citel.sender })
    const q = await sck1.findOne({ id: users })
    if ((q.infoRoleUsers.role === 'isAdminsBot' || q.infoRoleUsers.role === 'isCreator') && (user.infoRoleUsers.role === 'isAdminsBot' || user.infoRoleUsers.role === 'isCreator')) return citel.reply('[ error: forbidden ]')
    eco.takeMsg({ jid: users, amount: parseInt(textl.split(' ')[0]) })
    await Void.sendMessage(citel.chat, { text: replies.takeMsg({ msg: parseInt(text.split(' ')[0]), jid: users.split('@')[0] }), mentions: [users] }, { quoted: citel });
});

cmd({
    pattern: "resetaccount",
    isCreator: true,
    users: true
}, async ({ Void, citel, users }) => {
    if (citel.sender === users) return citel.react('')
    await sck1.deleteOne({ id: users })
    citel.react('✅')
})
//===========================================================

// Ping
cmd({
    pattern: "ping",
    alias: ["пинг"],
    desc: "скорость работы бота",
    category: ["🏠 Базовые команды"],
    level: 1,
}, async ({ Void, citel }) => {
    var initial = new Date().getTime();
    const { key } = await Void.sendMessage(citel.chat, { text: replies.ping({ status: 'start' }) });
    var final = new Date().getTime();
    const ping = final - initial;
    await Void.sendMessage(citel.chat, { text: replies.ping({ status: 'ok', ping: ping }), edit: key });
});

cmd({
    pattern: "devchat",
    alias: ['девмодчат'],
    isCreator: true
}, async ({ Void, citel }) => {
    await sck.updateOne({ id: citel.chat }, { role: "Dev" })
    citel.reply("Dev Мод успешно включен в данном чате....")
})

// Restart
cmd({
    pattern: "restart",
    alias: ["рестарт"],
    desc: "перезапуск бота",
    isCreator: true
}, async ({ Void, citel, text }) => {
    await citel.reply(replies.restart());
    Void.restartBot()
});

// Runtime Info
cmd({
    pattern: "info",
    alias: ["инфо", "runtime"],
    category: ["🏠 Базовые команды"],
    desc: 'информация бота',
    level: 1,
}, async ({ Void, citel, text }) => {
    function formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let i = 0;
        while (bytes >= 1024 && i < 4) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toFixed(2)} ${units[i]}`;
    }

    try {
        const sessions = await getSessionList();
        const sessionCount = sessions.length;

        const [DBUser, DBGroup] = await Promise.all([
            sck1.find({ orientation: { $ne: "-" } }),
            sck.find()
        ]);

        const uptimeInSeconds = process.uptime();
        const uptime = runtime(uptimeInSeconds);
        const totalMemory = formatBytes(os.totalmem());
        const useMemoryBytes = os.totalmem() - os.freemem();
        const useMemory = formatBytes(useMemoryBytes);
        const cpuInfo = os.cpus();
        const cpuInfoString = JSON.stringify(cpuInfo);
        const cpuInfoArray = JSON.parse(cpuInfoString);
        const osType = os.type();
        const osRelease = os.release();
        const osArch = os.arch();

        citel.reply(replies.infoBOT({
            uptime: uptime,
            users: DBUser.length,
            groups: DBGroup.length,
            sessions: sessionCount,
            useOZU: useMemory,
            totalOZU: totalMemory,
            cpu: cpuInfoArray[0].model,
            osType: osType,
            osRelease: osRelease,
            osArch: osArch
        }));
    } catch (err) {
        console.log(err);
        citel.reply('Произошла ошибка при получении информации.');
    }
});

// Ban
cmd({
    pattern: "ban",
    alias: ["бан"],
    desc: 'блокировка аккаунта пользователей',
    isCreator: true,
    users: true
}, async ({ Void, citel, text, users }) => {
    try {
        let pushnamer = Void.getName(users);
        await sck1.findOne({ id: users }).then(async (usr) => {
            if (!usr) {
                await new sck1({ id: users, 'dateBan.ban': true, 'dateBan.dateUnban': '26.10.1488, 99:99:69', 'dateBan.typeBan': 'perma', 'dateBan.reasonBan': text, 'dateBan.countBan': 1 }).save();
                citel.reply(replies.setBan('true', usr.name));
            } else {
                if (usr.dateBan.ban) return citel.reply(replies.setBan({ status: 'alreadyTRUE', user: pushnamer }));
                await sck1.updateOne(
                    { id: users },
                    {
                        $set: {
                            'dateBan.ban': true,
                            'dateBan.dateUnban': '26.10.1488, 99:99:69',
                            'dateBan.typeBan': 'perma',
                            'dateBan.dateBan': new Date(),
                            'dateBan.reasonBan': text || '-'
                        },
                        $inc: {
                            'dateBan.countBan': 1
                        }
                    }
                );
                citel.reply(replies.setBan({ status: 'true', user: usr.name }));
            }
        });
    } catch (e) {
        console.log(e);
        citel.reply(replies.notUser());
    }
});

// Unban
cmd({
    pattern: "unban",
    alias: ["разбан"],
    desc: 'разблокировка аккаунтов пользователей',
    isCreator: true,
    users: true,
}, async ({ Void, citel, text, users }) => {
    if (users === citel.sender) return citel.react('❌');
    try {
        await sck1.findOne({ id: users }).then(async (usr) => {
            if (!usr) {
                return citel.reply(replies.setBan('false', usr.name));
            } else {
                if (!usr.dateBan.ban) return citel.reply(replies.setBan({ status: 'alreadyFALSE', user: usr.name }));
                await sck1.updateOne(
                    { id: users },
                    {
                        $set: {
                            'dateBan.ban': false,
                            'dateBan.dateBan': '-',
                            'dateBan.dateUnban': '-',
                            'dateBan.typeBan': '-',
                            'dateBan.reasonBan': '-'
                        }
                    }
                );
                citel.reply(replies.setBan({ status: 'false', user: usr.name }));
            }
        });
    } catch (e) {
        citel.reply(replies.notUser());
    }
});