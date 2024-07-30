const { cmd, sck, sck1, runAnimation, stopAnimation, sleep } = require('../lib');
const lastActionTimes = {};

// Регистрируем команду 'setting' для управления настройками бота
cmd({
    pattern: "setting",
    alias: ["настройка", "настройки"],
    desc: "настройки бота (вкл команд, функций и возможно в будущем что-то еще)",
    category: "⚙️ Настройки"
}, async ({ Void, citel, text }) => {
    if (!text) return citel.reply(replies.notText({ text: 'setting' }));

    // Функция для обработки каждого случая асинхронно
    const handleCase = async (settingType, action) => {
        const user = await sck1.findOne({ id: citel.sender });
        const checkgroup = await sck.findOne({ id: citel.chat });

        switch (action) {
            case 'вкл':
            case 'act':
                switch (settingType) {
                    case 'antilink':
                    case 'антиссылка':
                        if (checkgroup?.antilink) return Void.sendMessage(citel.chat, { text: replies.act({ status: 'alreadyActAntilink' }) });

                        const { reactions: actAntilinkReactions, msg: actAntilinkMsg } = await Void.waitForReaction(citel, {
                            replic: "Стоимость данной команды 14 уровней, для продолжения поставьте реакцию -> 👍",
                            priceLvl: 14, react: '👍', time: 15000
                        });

                        if (actAntilinkReactions) {
                            if (!checkgroup) {
                                await new sck({ id: citel.chat, antilink: true }).save();
                            } else {
                                await sck.updateOne({ id: citel.chat }, { antilink: true });
                            }
                            Void.sendMessage(citel.chat, { text: replies.act({ status: 'actAntilink', priceLvl: 14, senderLvl: user.level }), edit: actAntilinkMsg.key });
                        }
                        break;

                    case 'events':
                    case 'уведомления':
                        if (checkgroup?.events) return Void.sendMessage(citel.chat, { text: replies.act({ status: 'alreadyActEvents' }) });

                        const { reactions: actEventsReactions, msg: actEventsMsg } = await Void.waitForReaction(citel, {
                            replic: "Стоимость данной команды 10 уровней, для продолжения поставьте реакцию -> 👍",
                            priceLvl: 10, react: '👍', time: 15000
                        });

                        if (actEventsReactions) {
                            if (!checkgroup) {
                                await new sck({ id: citel.chat, events: true }).save();
                            } else {
                                await sck.updateOne({ id: citel.chat }, { events: true });
                            }
                            Void.sendMessage(citel.chat, { text: replies.act({ status: 'actEvents', priceLvl: 10, senderLvl: user.level }), edit: actEventsMsg.key });
                        }
                        break;

                    case 'nsfw':
                    case 'нсфв':
                        if (!checkgroup) {
                            await new sck({ id: citel.chat, nsfw: true }).save();
                            citel.reply(replies.act({ status: 'actNsfw' }));
                        } else if (!checkgroup.nsfw) {
                            await sck.updateOne({ id: citel.chat }, { nsfw: true });
                            citel.reply(replies.act({ status: 'actNsfw' }));
                        } else {
                            citel.reply(replies.act({ status: 'alreadyActNsfw' }));
                        }
                        break;

                    case 'visible valute':
                    case 'видимость валюта':
                        if (user.visibleValute) {
                            citel.reply(replies.visibleValute('alreadyAct'));
                        } else {
                            await sck1.updateOne({ id: citel.sender }, { visibleValute: true });
                            citel.reply(replies.visibleValute('act'));
                        }
                        break;

                    case 'bot chat':
                    case 'бот чат':
                        const groupMetadata = await Void.groupMetadata(citel.chat);
                        if (citel.sender !== groupMetadata.owner) return citel.reply("Данная команда доступна только создателю группы !");

                        if (!checkgroup) {
                            await new sck({ id: citel.chat, botenable: "true" }).save();
                        } else if (checkgroup.botenable !== "true") {
                            await sck.updateOne({ id: citel.chat }, { botenable: "true" });
                        } else {
                            return citel.reply(replies.botStatus({ status: 'alreadyON' }));
                        }
                        citel.reply(replies.botStatus({ status: 'on' }));
                        break;

                    case 'adminswitch':
                        if (user.infoRoleUsers.status === 'VIP') {
                            if (checkgroup?.removeAdminSwitch) {
                                citel.reply('adminsWitch - уже был активирован');
                            } else {
                                await sck.updateOne({ id: citel.chat }, { removeAdminSwitch: true });
                                citel.reply('adminsWitch - успешно активирован');
                            }
                        } else {
                            citel.reply('Данная команда доступна только VIP пользователям, подробнее - .donate vip 1');
                        }
                        break;

                    default:
                        citel.reply('Error: Неверный параметр');
                }
                break;

            case 'выкл':
            case 'deact':
                switch (settingType) {
                    case 'antilink':
                    case 'антиссылка':
                        if (!checkgroup) {
                            await new sck({ id: citel.chat, antilink: false }).save();
                            citel.reply(replies.deact({ status: 'deactAntilink' }));
                        } else if (checkgroup.antilink) {
                            await sck.updateOne({ id: citel.chat }, { antilink: false });
                            citel.reply(replies.deact({ status: 'deactAntilink' }));
                        } else {
                            citel.reply(replies.deact({ status: 'alreadyDeactAntilink' }));
                        }
                        break;

                    case 'events':
                    case 'уведомления':
                        if (!checkgroup) {
                            await new sck({ id: citel.chat, events: false }).save();
                            citel.reply(replies.deact({ status: 'deactEvents' }));
                        } else if (checkgroup.events) {
                            await sck.updateOne({ id: citel.chat }, { events: false });
                            citel.reply(replies.deact({ status: 'deactEvents' }));
                        } else {
                            citel.reply(replies.deact({ status: 'alreadyDeactEvents' }));
                        }
                        break;

                    case 'nsfw':
                    case 'нсфв':
                        if (!checkgroup || !checkgroup.nsfw) return citel.reply('NSFW Уже был деактивирован');

                        const { reactions: deactNsfwReactions, msg: deactNsfwMsg } = await Void.waitForReaction(citel, {
                            replic: "Стоимость данной команды 5 уровней, для продолжения поставьте реакцию -> 👍",
                            priceLvl: 5, react: '👍', time: 15000
                        });

                        if (deactNsfwReactions) {
                            await sck.updateOne({ id: citel.chat }, { nsfw: false });
                            Void.sendMessage(citel.chat, { text: replies.deact({ status: 'deactNsfw', priceLvl: 5, senderMsg: user.level }), edit: deactNsfwMsg.key });
                        }
                        break;

                    case 'visible valute':
                    case 'видимость валюта':
                        if (!user.visibleValute) {
                            citel.reply(replies.visibleValute('alreadyDeact'));
                        } else {
                            await sck1.updateOne({ id: citel.sender }, { visibleValute: false });
                            citel.reply(replies.visibleValute('deact'));
                        }
                        break;

                    case 'bot chat':
                    case 'бот чат':
                        const groupMetadataDeact = await Void.groupMetadata(citel.chat);
                        if (citel.sender !== groupMetadataDeact.owner) return citel.reply("Данная команда доступна только создателю группы !");

                        if (!checkgroup) {
                            await new sck({ id: citel.chat, botenable: "false" }).save();
                        } else if (checkgroup.botenable !== "false") {
                            await sck.updateOne({ id: citel.chat }, { botenable: "false" });
                        } else {
                            return citel.reply(replies.botStatus({ status: 'alreadyOFF' }));
                        }
                        citel.reply(replies.botStatus({ status: 'off' }));
                        break;

                    case 'adminswitch':
                        if (user.infoRoleUsers.status === 'VIP') {
                            if (!checkgroup?.removeAdminSwitch) {
                                citel.reply('adminsWitch - уже был деактивирован');
                            } else {
                                await sck.updateOne({ id: citel.chat }, { removeAdminSwitch: false });
                                citel.reply('adminsWitch - успешно деактивирован');
                            }
                        } else {
                            citel.reply('Данная команда доступна только VIP пользователям, подробнее - .donate vip 1');
                        }
                        break;

                    default:
                        citel.reply('Error: Неверный параметр');
                }
                break;

            case "удалить":
            case "delete":
                if (user && (settingType === 'account' || settingType === 'аккаунт')) {
                    const senderId = citel.sender;
                    const lastActionTime = lastActionTimes[senderId] || 0;
                    const currentTime = Date.now();
                    const minInterval = 30 * 60 * 1000; // 30 минут в миллисекундах

                    if (currentTime - lastActionTime < minInterval) return;

                    lastActionTimes[senderId] = currentTime;
                    const { reactions: deleteReactions, msg: deleteMsg } = await Void.waitForReaction(citel, {
                        replic: "❗ ВНИМАНИЕ\n\n> Вы пытаетесь полностью сбросить аккаунт до начального состояния. Помните! После сброса аккаунта вы не получите как-либо привилегий. После сброса аккаунта, его восстановление Невозможно!!!\n\n> Поставьте любую реакцию, чтобы удалить аккаунт",
                        delafexec: true, time: 72000
                    });

                    if (deleteReactions) {
                        await sck1.deleteOne({ id: senderId });
                        runAnimation(citel);
                        await sleep(14000);
                        stopAnimation();
                        await citel.react('✅');
                        await Void.sendMessage(citel.sender, {
                            text: `Спасибо за то что были с нами, удачки.\n\nP.s Аккаунт(и все данные связанные с ним) с id - ${senderId}, был удален из базы данных RUSeck inc. Пока(`
                        }, { quoted: citel });
                    }
                }
                break;

            default:
                citel.reply('Error: Неизвестное действие');
        }
    };

    // Асинхронная обработка команд
    const processCommand = async () => {
        const commandParts = text.split(" ");
        const action = commandParts[0];
        const settingType = commandParts.slice(1).join(" ").toLowerCase();

        await handleCase(settingType, action);
    };

    // Использование setImmediate для асинхронной обработки
    setImmediate(processCommand);
});