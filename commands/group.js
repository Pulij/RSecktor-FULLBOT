const { sck, cmd, warndb, getAdmin } = require('../lib')
const { sessionsMap } = require('../lib/client.js')
//--------------------Варны-------------------------------------------------------
cmd({
    pattern: "warn",
    alias: ["пред"],
    category: "🌎 Группа",
    desc: "выдать предупреждение участнику группы",
    isGroup: true,
    isAdmins: true,
    botAdmins: true,
    users: true,
}, async ({ Void, citel, text, users }) => {
    const currentDate = new Date().toLocaleString();
    const warning = await warndb.findOne({ warnedId: users, groupId: citel.chat });
    const parts = text.trim().split(" ");

    if (users === citel.sender) return citel.react('❌');
    if (!text) return citel.reply(replies.notText({ text: 'warn' }));
    let reason;
    if (text.split(" ")[0] && text.split(" ")[0].startsWith("@")) {
        reason = parts.slice(1).join(" ");
    } else {
        reason = text
    }
    if (!reason) return citel.reply(replies.notText({ text: 'warn' }));

    if (warning) {
        if (warning.count >= 2) {
            await citel.reply(replies.warn({ status: 'rem', userId: users, gName: citel.gName }));
            await Void.groupParticipantsUpdate(citel.chat, [users], "remove");
            await warndb.deleteMany({
                warnedId: users,
                groupId: citel.chat
            });
        } else {
            const existingDateWarn = warning.dateWarn || [];
            const existingAdminIndex = existingDateWarn.findIndex(item => item.id === citel.sender);

            if (existingAdminIndex !== -1) {
                // Если админ уже выдавал предупреждение, обновляем причину
                const existingReason = existingDateWarn[existingAdminIndex].reason || '';
                const updatedReason = existingReason ? `${existingReason}, ${reason}` : reason;
                existingDateWarn[existingAdminIndex].reason = updatedReason;
                existingDateWarn[existingAdminIndex].count++; // Увеличиваем счетчик предупреждений
            } else {
                // Если админ выдает предупреждение в первый раз, добавляем новую запись
                existingDateWarn.push({ id: citel.sender, date: currentDate, reason: reason, count: 1 });
            }

            await warndb.updateOne(
                { warnedId: users },
                {
                    $set: { dateWarn: existingDateWarn },
                    $inc: { count: 1 }
                }
            );
        }
    } else {
        // Создаем новую запись о предупреждении
        await new warndb({
            warnedId: users,
            groupId: citel.chat,
            dateWarn: [{ id: citel.sender, date: currentDate, reason: reason, count: 1 }],
            count: 1
        }).save();
    }

    citel.react('✅');
});
//---------------------------------------------------------------------------
cmd({
    pattern: "rwarn",
    alias: ["распред"],
    desc: "снять предупреждение у участника группы",
    category: "🌎 Группа",
    isGroup: true,
    botAdmins: true,
    isAdmins: true,
    users: true
}, async ({ Void, citel, text, users }) => {
    if (users === citel.sender && !citel.isCreator) return citel.react('❌');
    await warndb.deleteMany({ warnedId: users, groupId: citel.chat });
    citel.react('✅');
});
//-----------------------------------------------------------------------------------------------
cmd({
    pattern: "checkwarn",
    alias: ["чекпред"],
    category: "🌎 Группа",
    desc: "просмотреть все предупреждения пользователя в чате",
    isGroup: true,
    botAdmins: true,
    users: true
}, async ({ Void, citel, users }) => {
    try {
        const warnings = await warndb.find({ warnedId: users, groupId: citel.chat });
        const mentions = []
        if (warnings.length === 0) return citel.reply("У пользователя нет предупреждений в этой группе.");

        let response = `*${users}:*\n`;
        response += `*Предупреждения:*\n\n`

        warnings.forEach((warning, index) => {
            warning.dateWarn.forEach((dateWarn, warnIndex) => {
                response += `> ⚠️ Администратор: @${dateWarn.id.split('@')[0]}\n`;
                mentions.push(dateWarn.id)
                response += `> 🔰 Дата и время: ${dateWarn.date}\n`;
                response += `> 🔰 Причина: ${dateWarn.reason}\n`;
                response += `> 🔰 Кол-во: ${dateWarn.count}\n\n`
            });
            response += `                                         *🔰 Всего: ${warning.count}*`;
        });

        await Void.sendMessage(citel.chat, { text: response, mentions: mentions }, { quoted: citel });
    } catch (error) {
        console.error("Ошибка при проверке предупреждений:", error);
        await citel.reply("Произошла ошибка при проверке предупреждений.");
    }
});
//------------------Отметка участников---------------------------------------------------------
cmd({
    pattern: "tagadmins",
    alias: ["админтег"],
    desc: "позвать администраторов группы",
    category: "🌎 Группа",
    isGroup: true,
    botAdmins: true,
}, async ({ Void, citel, text }) => {
    const groupAdmins = await getAdmin(Void, citel);
    const textt = replies.tagadminsResponse(groupAdmins, citel, text);

    await Void.sendMessage(citel.chat, {
        text: textt,
        mentions: groupAdmins,
    }, {
        quoted: citel,
    });
});
//------------------------------------------------------------------------
cmd({
    pattern: 'noactiv',
    level: 1,
    isCreator: true,
    isGroup: true,
    botAdmins: true,
}, async ({ Void, citel }) => {
    let deletedCount = 0;
    const groupMetadata = citel.isGroup ? await Void.groupMetadata(citel.chat).catch(() => { }) : '';
    const usersFromDatabase = await sck1.find();
    const userIdsFromDatabase = usersFromDatabase.map(user => user.id);
    const participantIds = groupMetadata.participants.map(participant => participant.id);
    const usersToRemove = participantIds.filter(id => !userIdsFromDatabase.includes(id));
    citel.reply(replies.process());

    for (const userId of usersToRemove) {
        deletedCount++;
        console.log(`Пользователь с ID ${userId} был удалён из группы.`);
        await Void.groupParticipantsUpdate(citel.chat, [userId], "remove");
        await sleep(1000)
    }

    console.log(`Всего было удалено пользователей: ${deletedCount}`);
});
//------------------------------------------------------------------------
cmd({
    pattern: "hidetag",
    alias: ["htag", "скрытыйтег"],
    desc: "отметить всех участников группы",
    category: "🌎 Группа",
    isGroup: true,
    isAdmins: true,
    botAdmins: true,
    priceMsg: 12700
}, async ({ Void, citel, text }) => {
    const groupMetadata = citel.isGroup ? await Void.groupMetadata(citel.chat).catch((e) => { }) : "";
    const participants = citel.isGroup ? await groupMetadata.participants : "";

    await Void.sendMessage(citel.chat, { text: text ? text : "", mentions: participants.map((a) => a.id) }, {
        quoted: citel,
    });
});
//----------------------Выдача прав,удаление участников
cmd({
    pattern: "prom",
    alias: ["пром"],
    desc: "выдать права администратора участнику группы",
    category: "🌎 Группа",
    isGroup: true,
    isAdmins: true,
    users: true,
    botAdmins: true,
}, async ({ Void, citel, users }) => {
    if (users === citel.sender && !citel.isCreator) return citel.react('❌')
    await Void.groupParticipantsUpdate(citel.chat, [users], "promote");
})
//-------------------------------------------
cmd({
    pattern: "dem",
    alias: ["дем"],
    category: "🌎 Группа",
    desc: "забрать права администратора у участника группы",
    isGroup: true,
    isAdmins: true,
    users: true,
    botAdmins: true,
}, async ({ Void, citel, text, users }) => {
    if (citel.sender === users && !citel.isCreator) return citel.react('❌')
    await Void.groupParticipantsUpdate(citel.chat, [users], "demote");
});
//---------------------------------------------------------------------------
cmd({
    pattern: "rem",
    alias: ["рем"],
    desc: "выгнать участника из группы",
    category: "🌎 Группа",
    isGroup: true,
    isAdmins: true,
    users: true,
    botAdmins: true,
}, async ({ Void, citel, text, users }) => {
    const botNumber = await Void.decodeJid(Void.user.id);
    if (citel.sender === users && !citel.isCreator || users === botNumber && !citel.isCreator) return citel.react('❌')
    await Void.groupParticipantsUpdate(citel.chat, [users], "remove");
});
//---------------------------------------------------------------------------
cmd({
    pattern: "add",
    alias: ["добавить"],
    desc: "добавить участника в группу",
    category: "🌎 Группа",
    isGroup: true,
    isAdmins: true,
    users: true,
    botAdmins: true,
    priceMsg: 75
}, async ({ Void, citel, text, users }) => {
    try {
        const add = (await Void.groupParticipantsUpdate(citel.chat, [users], "add"))[0];
        const addinfo = add.content;

        if (add.status === '409') {
            return await citel.react('🆗');
        } else if (add.status === '408') {
            let response = await Void.groupInviteCode(citel.chat)
            let link = 'https://chat.whatsapp.com/' + response
            await Void.sendMessage(users, { text: replies.add({ link: link }) })
            citel.react('⏳')
        } else if (add.status === '200') {
            citel.react('✅');
        } else {
            await citel.react('⏳')
            await Void.sendAcceptInviteV4(citel.chat, users, addinfo)
        }
    } catch (error) {
        console.error("Error in add command:", error);
        await citel.react('❌');
    }
});
//---------------------------------------------------------------------------
cmd({
    pattern: "del",
    alias: ["delete", "удалить"],
    desc: "удалить сообщение участника группы",
    category: "🌎 Группа",
    botAdmins: true,
    isGroup: true,
    isAdmins: true,
    users: true
}, async ({ Void, citel, text }) => {
    if (!citel.quoted.isBot) {
        const QKey = {
            remoteJid: citel.chat,
            fromMe: false,
            id: citel.quoted.id,
            participant: citel.quoted.sender
        }

        const SKey = {
            remoteJid: citel.chat,
            fromMe: false,
            id: citel.key.id,
            participant: citel.key.participant
        }

        await Void.sendMessage(citel.chat, { delete: QKey })
        await Void.sendMessage(citel.chat, { delete: SKey })
    }
});
//---------------------------Приветствия/Прощания
cmd({
    pattern: "setwelcome",
    alias: ["установитьприветствие"],
    desc: "установить приветствие новых участников",
    alais: ["приветствие"],
    category: "🌎 Группа",
    priceMsg: "10 уровней",
    botAdmins: true,
    isGroup: true,
}, async ({ Void, citel, text }) => {
    let Group = await sck.findOne({ id: citel.chat })
    if (!text) return citel.reply(replies.notText({ text: 'setwelcome' }))
    const { reactions, msg } = await Void.waitForReaction(citel, { replic: "Стоимость данной команды 10 уровней, для продолжения поставьте реакцию -> 👍", priceLvl: 10, react: '👍', time: 15000 });
    if (reactions) {
        if (!Group) {
            await new sck({ id: citel.chat, welcome: text, events: true }).save()
            await Void.sendMessage(citel.chat, { text: replies.welcome({ status: 'welcomeNew' }), edit: msg.key })
        } else {
            await sck.updateOne({ id: citel.chat }, { welcome: text, events: true })
            await Void.sendMessage(citel.chat, { text: replies.welcome({ status: 'welcomeOld' }), edit: msg.key })
        }
    }
})
//---------------------------------------------------------------------------
cmd({
    pattern: "setgoodbye",
    desc: "установить прощание покинувших/удаленных участников",
    alias: ["установитьпрощание"],
    category: "🌎 Группа",
    priceMsg: "10 уровней",
    botAdmins: true,
    isGroup: true,
}, async ({ Void, citel, text }) => {
    let Group = await sck.findOne({ id: citel.chat })
    if (!text) return citel.reply(replies.notText({ text: 'setgoodbye' }))
    const { reactions, msg } = await Void.waitForReaction(citel, { replic: "Стоимость данной команды 10 уровней, для продолжения поставьте реакцию -> 👍", priceLvl: 10, react: '👍', time: 15000 });
    if (reactions) {
        if (!Group) {
            await new sck({ id: citel.chat, goodbye: text, events: true }).save()
            await Void.sendMessage(citel.chat, { text: replies.welcome({ status: 'goodbyeNew' }), edit: msg.key });
        } else {
            await sck.updateOne({ id: citel.chat }, { goodbye: text, events: true })
            await Void.sendMessage(citel.chat, { text: replies.welcome({ status: 'goodbyeOld' }), edit: msg.key });
        }
    }
})
//--------------------------------Другое-------------------------------------------
cmd({
    pattern: "bc",
    alias: ["рассылка"],
    isCreator: true
}, async ({ Void, citel, text }) => {
    let sessionCount = 0;
    let successCount = 0;
    const { key } = await citel.reply('Расылка запущена...')
    sessionsMap.forEach((session) => {
        if (session && session.sendMessage) {
            sessionCount++;
        }
    });

    sessionsMap.forEach(async (session, name) => {
        if (session && session.sendMessage) {
            session.sendMessage(name, { text: text });
            successCount++;
            await Void.sendMessage(citel.chat, { text: `Отправка - ${successCount}/${sessionCount}`, edit: key }, { quoted: citel })
        }
    });
});
