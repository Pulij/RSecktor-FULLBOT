const { cmd, sck1, marrynaxoi, getBuffer, getAdmin, stat, checkNextLevel, updateLevel, sleep, calcMessagesPerLevel, calcLevelUpPrice } = require('../lib')
const eco = require('../lib/economyFunction/msgFunc.js')
const { stylizeText } = require('../lib/exif.js')
const {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
} = require('@whiskeysockets/baileys')
const { createPayment } = require('../lib/api/юкасса.js')
let activeLevelUpRequests = {};
//=========================================Обмен валюты
cmd({
  pattern: "chhh"
}, async ({ Void, citel }) => {
  async function calculateAverageValues() {
    try {
      const result = await sck1.aggregate([
        {
          $group: {
            _id: null,
            totalMsg: { $sum: "$msg" },
            totalSumMsgBank: { $sum: "$bank.sumMsgBank" }
          }
        },
        {
          $project: {
            _id: 0,
            totalMsg: { $round: ["$totalMsg", 0] },
            totalSumMsgBank: { $round: ["$totalSumMsgBank", 0] }
          }
        }
      ]);

      if (result.length > 0) {
        const { totalMsg, totalSumMsgBank } = result[0];
        citel.reply(`Общее значение msg: ${totalMsg}\n\nОбщее значение bank.sumMsgBank: ${totalSumMsgBank}`)
      } else {
        console.log('Нет данных для расчета общего значения');
      }
    } catch (err) {
      console.error('Ошибка при расчете общего значения:', err);
    }
  }

  calculateAverageValues()
})
//giveMyMsg
cmd({
  pattern: "givemymsg",
  alias: ['датьмоимсг'],
  category: "💸 Экономика",
  desc: "передать свои msg",
  users: true
}, async ({ Void, citel, text, users }) => {
  if (!text) return
  const checknum = await Void.onWhatsApp(`${users}`)
  let numw = '0@s.whatsapp.net'
  if (checknum[0]) {
    const user = await sck1.findOne({ id: citel.sender })
    const brackcheck = await marrynaxoi.findOne({ id: citel.sender })
    if (brackcheck.who && users === brackcheck.who) return citel.reply('Нельзя переводить валюту тому с кем ты в браке, т.к у вас общий баланс..')
    if (citel.sender === users) return citel.reply('Вы не можете переводить валюту самому себе')
    if (!users) return citel.reply('Используй .givemymsg 1000 @');
    if (user.msg < parseInt(text.split(' ')[0])) return citel.reply(`Вы не можете перевести ${parseInt(text.split(' ')[0])} msg,т.к у вас всего-лишь ${user.msg}`);

    if (parseInt(text.split(' ')[0]) < 0) return citel.reply(`>= 0`);
    await eco.giveMyMsg({ jid: citel.sender, mentionedJid: users, amount: parseInt(text.split(' ')[0]) });
    await Void.sendMessage(citel.chat, { text: `Вы передали ${parseInt(text.split(' ')[0])} msg ему @${users.split('@')[0]}`, mentions: [users] }, { quoted: citel });
  } else {
    await Void.sendMessage(citel.chat, { text: `Вы передали ${parseInt(text.split(' ')[0])} msg ему @${numw.split('@')[0]}`, mentions: [numw] }, { quoted: citel })
  }
})

cmd({
  pattern: "bank",
  alias: ["банк"],
  category: "💸 Экономика",
  desc: "действия с sv bank"
}, async ({ Void, citel, text }) => {
  try {
    const user = await sck1.findOne({ id: citel.sender });
    const brak = await marrynaxoi.findOne({ id: citel.sender });

    const commandParts = text.split(" ");
    const action = commandParts[0];

    switch (action) {
      case "положить":
      case "put": {
        if (!user.bank.card) {
          return await Void.sendMessage(citel.chat, { text: `У вас нет карты, используйте .bank buycard` }, { quoted: citel });
        }

        const amount = parseInt(commandParts[1], 10);
        if (isNaN(amount) || amount <= 0) {
          return citel.reply('Введите корректную сумму для операции.');
        }
        if (brak.status === 'registered') {
          return citel.reply('В браке можно только снимать мсг');
        }
        if (user.msg < amount) {
          return citel.reply(`У вас недостаточно MSG для проведения операции. У вас всего ${user.msg} MSG.`);
        }
        if (user.bank.sumMsgBank + amount > user.bank.cell * 100000) {
          return citel.reply(`У вас недостаточно ячеек для пополнения балана. Воспользуйтесь .bank cellbuy`);
        }
        await sck1.updateOne({ id: citel.sender }, { $inc: { 'bank.sumMsgBank': amount } });
        eco.takeMsg({ jid: citel.sender, amount: amount });
        citel.react('✅');
      }
        break;

      case "снять":
      case "take": {
        if (!user.bank.card) {
          return await Void.sendMessage(citel.chat, { text: `У вас нет карты, используйте .bank buycard` }, { quoted: citel });
        }

        const amount = parseInt(commandParts[1], 10);
        if (isNaN(amount) || amount <= 0) {
          return citel.reply('Введите корректную сумму для операции.');
        }
        if (user.bank.sumMsgBank < amount) {
          return citel.reply(`У вас недостаточно MSG на счету. У вас всего ${user.bank.sumMsgBank} MSG.`);
        }

        if (brak.status === 'registered') {
          await sck1.updateOne({ id: citel.sender }, { $inc: { 'bank.sumMsgBank': -amount } });
          eco.giveMsg({ jid: citel.sender, amount: amount });
          eco.giveMsg({ jid: brak.who, amount: amount });
        } else {
          await sck1.updateOne({ id: citel.sender }, { $inc: { 'bank.sumMsgBank': -amount } });
          eco.giveMsg({ jid: citel.sender, amount: amount });
        }
        citel.react('✅');
      }
        break;

      case "купитькарту":
      case "buycard": {
        if (user.bank.card) {
          return await Void.sendMessage(citel.chat, { text: `У вас уже есть карта.` }, { quoted: citel });
        }

        const { reactions, msg } = await Void.waitForReaction(citel, { priceMsg: 39990, replic: 'Покупка банковской карты, сумма - 39990 MSG\n\nДля подтверждения поставьте любую реакцию на данное сообщение!' });
        if (reactions) {
          await sck1.updateOne({ id: citel.sender }, { 'bank.card': true });
          await Void.sendMessage(citel.chat, { text: `_Обработка запроса, пожалуйста, подождите..._`, edit: msg.key });
          await sleep(5000);
          await Void.sendMessage(citel.chat, { text: `Поздравляем с покупкой! Пользйтесь банком с пользой)`, edit: msg.key });
        }
      }
        break;
      // Доп кaсы, msg и cell 
      case "cellinfo":
      case "ячейки": {
        if (!user.bank.card) {
          return await Void.sendMessage(citel.chat, { text: `У вас нет карты, используйте .bank buycard` }, { quoted: citel });
        }
        let txt = `*Ячейки. В них мы храним MSG.*\n\n` +
          `*Стоимость ячейки разная. От 100.000 msg до бескончости.*`;
        await Void.sendMessage(citel.chat, { text: txt }, { quoted: citel });
      }
        break;
      case "cellbuy":
      case "купитьячейку": {
        if (!user.bank.card) {
          return await Void.sendMessage(citel.chat, { text: `У вас нет карты, используйте .bank buycard` }, { quoted: citel });
        }
        let allCell = user.bank.cell;
        let allMsgBank = user.bank.sumMsgBank;
        if (allCell * 100000 === allMsgBank) {
          citel.react('⏳');
          await sck1.updateOne({ id: citel.sender }, { 'bank.cell': allCell + 1 });
          await sck1.updateOne({ id: citel.sender }, { 'bank.sumMsgBank': 0 })
          await sleep(2000);
          citel.react('✅');
        }
        else {
          await Void.sendMessage(citel.chat, { text: `*Бро, тебе нужно ${user.bank.cell * 100000} msg в банке...*` }, { quoted: citel });
        }
      }
        break;
      default: {
        if (!user.bank.card) {
          return await Void.sendMessage(citel.chat, { text: `У вас нет карты, используйте .bank buycard` }, { quoted: citel });
        }

        let txt = `*Команды:*\n\n` +
          `> *${stylizeText('.bank put сумма')}* - положить наличные MSG в банк\n` +
          `> *${stylizeText('.bank take сумма')}* - снять MSG с банка\n` +
          `> *${stylizeText('.bank cellbuy')}* - купить доп. ячейку\n` +
          `> *${stylizeText('.bank cellinfo')}* - информация о ячейках\n\n` +
          `*Процент накопления:*\n\n` +
          `*Free user* - _+1%/Актив час_\n` +
          `*VIP user* - _+2%/Актив час_`;

        await Void.sendMessage(citel.chat, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              title: `Лимит MSG: ${user.bank.cell * 100000} -> RSecktor BANK`,
              body: `Ячеек: ${user.bank.cell}, MSG: ${user.bank.sumMsgBank}`,
              sourceUrl: "1488",
              thumbnailUrl: 'https://fonoteka.top/uploads/posts/2021-05/1621901174_4-phonoteka_org-p-fon-dlya-igri-krestiki-noliki-4.jpg',
            },
          }
        }, { quoted: citel });
      }
    }
  } catch (error) {
    citel.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.');
  }
});
//========================================Информация + уровни
//levelup
cmd({
  pattern: "levelup",
  alias: ["повыситьуровень"],
  desc: 'повысить уровень',
  category: "💸 Экономика"
}, async ({ Void, citel }) => {
  const user = await sck1.findOne({ id: citel.sender });
  if (user && user.level >= 50) return citel.reply('У вас максимальный уровень');
  const priceMsg = await calcLevelUpPrice(citel.sender);

  if (activeLevelUpRequests[citel.sender]) return;
  activeLevelUpRequests[citel.sender] = true;

  try {
    const { reactions, msg } = await Void.waitForReaction(citel, { priceMsg: priceMsg, react: '👍', time: 15000 });

    if (reactions) {
      const mPerLevel = await calcMessagesPerLevel(citel.sender);
      await Void.sendMessage(citel.chat, { text: replies.process(), edit: msg.key });
      await sck1.updateOne({ id: citel.sender }, { allMsg: mPerLevel });
      await updateLevel(citel.sender);
      await sleep(1400);
      await Void.sendMessage(citel.chat, { text: replies.levelUp({ oldLvl: user.level, newLvl: user.level + 1, newMsg: user.msg - priceMsg }), edit: msg.key });
    }
  } finally {
    delete activeLevelUpRequests[citel.sender];
  }
});

//checkinfo
cmd({
  pattern: "checkinfo",
  alias: ["checkmsg", "чекмсг", "чекинфо"],
  category: "💎 VIP",
  isVip: true,
  users: true,
  desc: "показывает статистику отмеченного пользователя"
}, async ({ Void, citel, text, users }) => {
  const checkUser = await sck1.findOne({ id: users });
  const stati = await stat.findOne({ userId: citel.sender, chatId: citel.chat })
  const msg = await Void.sendMessage(citel.chat, { text: replies.process() })
  await sleep(2000)
  await Void.sendMessage(citel.chat, { text: replies.priceEndProcess(1000), edit: msg.key })
  await sleep(1700)
  await Void.sendMessage(citel.chat, { text: replies.checkUserInfo({ users: users, msg: checkUser.msg, dailyMsg: stati.data.msg.dailyMsg }), edit: msg.key, mentions: [users] }, { quoted: citel });
})

//setorientation
cmd({
  pattern: "setorientation",
  desc: "изменить ориентацию",
  category: "💸 Экономика",
  alias: ["ориентация"],
}, async ({ Void, citel, text }) => {
  if (!text || text.length > 17 || !/^[а-яА-Я\w\s\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F170}-\u{1F251}\d]+$/u.test(text)) return citel.reply(replies.notText({ text: 'orientation' }));

  await sck1.updateOne({ id: citel.sender }, { orientation: text.split(' ')[0] }, { upsert: true });
  citel.reply(replies.setOrientation(text.split(' ')[0]));
});

//rank
cmd({
  pattern: "rank",
  alias: ['ранг', 'ранк'],
  desc: "ваш ранг",
  category: ["💸 Экономика"],
}, async ({ Void, citel }) => {
  try {
    let stati
    const [user, brakcheck, isAdmin] = await Promise.all([
      sck1.findOne({ id: citel.sender }),
      marrynaxoi.findOne({ id: citel.sender }),
      citel.isGroup ? getAdmin(Void, citel).then(admins => admins.includes(citel.sender)) : false
    ]);

    if (citel.isGroup) {
      stati = await stat.findOne({ userId: citel.sender, chatId: citel.chat })
    } else {
      const botNumber = await Void.decodeJid(Void.user.id);
      if (citel.sender === botNumber) {
        stati = await stat.findOne({ userId: citel.sender, chatId: citel.chat })
      } else {
        stati = await stat.findOne({ userId: citel.sender, chatId: botNumber })
      }
    }

    if (user.orientation === '-') return citel.reply('Установите ориентацию - .setorientation Gay1111')

    const groupRole = isAdmin ? 'Админ' : 'Участник';
    const role = await replies.getRoleByLevel(citel.sender);
    const checkbrak = await replies.getMarriageInfoText(citel.sender);

    let mesgg = replies.visibleText(user.visibleValute) + user.msg;

    let userCheck = '';
    if (user.infoRoleUsers.status === 'VIP') {
      userCheck = replies.vip();
    } else if (user.infoRoleUsers.status === 'isCreator') {
      userCheck = '✅ isCreator';
    }

    let textr = replies.greeting(citel.pushName);
    let checkmsgBrr = (brakcheck?.status === 'registered') ? replies.msgFamily(mesgg) : replies.msgTotal(mesgg);

    if (user.orientation && groupRole) {
      textr += `${replies.userStats}\n`;
      textr += `${replies.role(role)}\n`;
      textr += `${replies.groupRole(groupRole)}\n`;
      textr += `——————————\n`;
      textr += `${replies.level(user.level)}\n`;
      textr += `${await replies.nextLevel(citel, checkNextLevel)}\n\n`;
      textr += `${checkmsgBrr}\n`;
      textr += `${replies.dailyMsg(stati.data.msg.dailyMsg) || 0}\n`;
      textr += `——————————\n`;
      textr += `${checkbrak}\n`;
      textr += `${replies.orientation(user.orientation)}\n`;
      if (userCheck && user.infoRoleUsers.endDateVIP !== '-') {
        textr += `\n> [ ${userCheck} ] (До ${user.infoRoleUsers.endDateVIP instanceof Date ? user.infoRoleUsers.endDateVIP.toLocaleString() : user.infoRoleUsers.endDateVIP})`;
      } else if (userCheck) {
        textr += `\n> [ ${userCheck} ]`;
      }

      let ppuser;
      try {
        ppuser = await Void.profilePictureUrl(citel.sender, "image");
      } catch {
        ppuser = THUMB_IMAGE;
      }

      await Void.sendMessage(citel.chat, {
        image: await getBuffer(ppuser),
        caption: textr,
        mentions: [citel.sender, brakcheck?.who]
      }, {
        quoted: citel,
      });
    } else {
      citel.reply(replies.notOrientation());
    }
  } catch (e) {
    citel.reply('Не удалось загрузить, попробуйте еще раз')
  }
});
//====================================================================
cmd({
  pattern: "dllb",
  alias: ["дллб"],
  desc: "дневная локальная доска лидеров"
}, async ({ Void, citel }) => {
  try {
    let leadtext = "*🏆 Дневные лидеры*\n\n";
    if (citel.isGroup) {
      const chat = await stat.find({ chatId: citel.chat, 'data.msg.dailyMsg': { $gt: 0 } }).sort({ 'data.msg.dailyMsg': -1 }).limit(12);
      const { key } = await citel.reply(leadtext)
      for (let i = 0; i < chat.length; i++) {
        const ttms = chat[i].data.msg.dailyMsg;
        const place = (i < 3) ? ['🥇', '🥈', '🥉'][i] : `*${i + 1}.*`;
        leadtext += `> ${place} ${chat[i].name}\n> *💬 Message daily:* ${ttms}\n\n`;
        if (i === chat.length - 1) leadtext += `                                     ⋆˚🐾˖°`;
        await Void.sendMessage(citel.chat, { text: leadtext, edit: key });
      }
    } else {
      const botNumber = await Void.decodeJid(Void.user.id);
      let VUser, sender, leadtext = '';

      if (citel.sender === botNumber) {
        VUser = await stat.findOne({ userId: botNumber, chatId: citel.chat });
        sender = await stat.findOne({ userId: citel.chat, chatId: citel.sender });

        if (VUser && sender) {
          if (VUser.data.msg.dailyMsg >= sender.data.msg.dailyMsg) {
            leadtext += `> 🥇 ${VUser.name}\n> *💬 Message daily:* ${VUser.data.msg.dailyMsg}\n\n`;
            leadtext += `> 🥈 ${sender.name}\n> *💬 Message daily:* ${sender.data.msg.dailyMsg}\n`;
          } else {
            leadtext += `> 🥇 ${sender.name}\n> *💬 Message daily:* ${sender.data.msg.dailyMsg}\n\n`;
            leadtext += `> 🥈 ${VUser.name}\n> *💬 Message daily:* ${VUser.data.msg.dailyMsg}\n`;
          }
        } else if (VUser !== null) {
          leadtext += `> 🥇 ${VUser.name}\n> *💬 Message daily:* ${VUser.data.msg.dailyMsg}\n`;
        } else if (sender !== null) {
          leadtext += `> 🥇 ${sender.name}\n> *💬 Message daily:* ${sender.data.msg.dailyMsg}\n`;
        } else {
          leadtext += `> 🥇 ${sender ? sender.name : 'Unknown'}\n> *💬 Message daily:* 0\n\n`;
          leadtext += `> 🥈 ${VUser ? VUser.name : 'Unknown'}\n> *💬 Message daily:* 0\n`;
        }

        await Void.sendMessage(citel.chat, { text: leadtext }, { quoted: citel });
      } else {
        VUser = await stat.findOne({ userId: botNumber, chatId: citel.chat });
        sender = await stat.findOne({ userId: citel.chat, chatId: botNumber });

        if (VUser && sender) {
          if (VUser.data.msg.dailyMsg >= sender.data.msg.dailyMsg) {
            leadtext += `> 🥇 ${VUser.name}\n> *💬 Message daily:* ${VUser.data.msg.dailyMsg}\n\n`;
            leadtext += `> 🥈 ${sender.name}\n> *💬 Message daily:* ${sender.data.msg.dailyMsg}\n`;
          } else {
            leadtext += `> 🥇 ${sender.name}\n> *💬 Message daily:* ${sender.data.msg.dailyMsg}\n\n`;
            leadtext += `> 🥈 ${VUser.name}\n> *💬 Message daily:* ${VUser.data.msg.dailyMsg}\n`;
          }
        } else if (VUser !== null) {
          leadtext += `> 🥇 ${VUser.name}\n> *💬 Message daily:* ${VUser.data.msg.dailyMsg}\n`;
        } else if (sender !== null) {
          leadtext += `> 🥇 ${sender.name}\n> *💬 Message daily:* ${sender.data.msg.dailyMsg}\n`;
        } else {
          leadtext += `> 🥇 ${sender ? sender.name : 'Unknown'}\n> *💬 Message daily:* 0\n\n`;
          leadtext += `> 🥈 ${VUser ? VUser.name : 'Unknown'}\n> *💬 Message daily:* 0\n`;
        }

        await Void.sendMessage(citel.chat, { text: leadtext }, { quoted: citel });
      }
    }
  } catch (error) {
    console.error('Ошибка при выполнении команды:', error);
    return citel.reply('❗ *Ошибка*\n\n> Не так быстро!!, Попробуйте ещё раз позже..');
  }
});
//----------------------------------------------------------------------------
cmd({
  pattern: "glb",
  alias: ["глб"],
  desc: "глобальная доска лидеров по msg",
  category: ["💸 Экономика"],
  react: "⏳"
}, async ({ Void, citel }) => {
  try {
    const sections = [];
    const rows = [];
    const pipeline = [
      {
        $match: { msg: { $gt: 0 } }
      },
      {
        $project: {
          id: 1,
          name: 1,
          totalMsg: { $sum: ["$msg", "$bank.sumMsgBank"] }
        }
      },
      {
        $sort: { totalMsg: -1 }
      }
    ];

    const users = await sck1.aggregate(pipeline).exec();

    users.forEach((user, index) => {
      console.log(user)
      const id = user.id.split('@')[0]
      rows.push({
        title: `${index + 1}. ${user.name}`,
        description: `💬 Всего MSG: ${user.totalMsg}\n№ -> ${id}`,
        id: ""
      });
    })

    sections.push({
      title: 'Список глобальных лидеров:',
      rows
    });

    const img = await prepareWAMessageMedia({ image: { url: "https://i.ytimg.com/vi/gpzdyqL270s/maxresdefault.jpg" } }, { upload: Void.waUploadToServer });
    let msg = generateWAMessageFromContent(citel.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: "RSecktor-L" },
            header: {
              hasMediaAttachment: false
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: 'single_select',
                  buttonParamsJson: JSON.stringify({
                    title: 'Глобальные лидеры',
                    sections
                  })
                },
              ],
              messageParamsJson: ''
            }
          },
        }
      }
    }, {
      quoted: {
        key: citel.key,
        message: {
          listResponseMessage: {
            title: citel.body
          },
        },
      }
    });

    await Void.relayMessage(msg.key.remoteJid, msg.message, {
      messageId: msg.key.id
    });

    citel.react('✅');
  } catch (e) {
    console.error('Ошибка при выполнении команды:', e);
    return citel.reply('❗ *Ошибка*\n\n> Не так быстро!!, Попробуйте ещё раз позже..');
  }
})
//---------------------------------------------------------------------------
cmd({
  pattern: "llb",
  alias: ["locallb", "ллб"],
  desc: "локальная доска лидеров по msg",
  category: ["💸 Экономика"],
  react: "⏳"
}, async ({ Void, citel }) => {
  try {
    const botNumber = await Void.decodeJid(Void.user.id);
    let txtBoard = "*🏆 Локальная доска*\n\n";

    if (citel.isGroup) {
      let userIds = [];
      const groupMetadata = await Void.groupMetadata(citel.chat).catch((e) => { });
      const participants = groupMetadata.participants;
      userIds = participants.map(p => p.id);

      const pipeline = [
        {
          $match: { id: { $in: userIds } }
        },
        {
          $project: {
            name: 1,
            totalMsg: { $sum: ["$msg", "$bank.sumMsgBank"] }
          }
        },
        {
          $sort: { totalMsg: -1 }
        },
        {
          $limit: 12
        }
      ];

      const users = await sck1.aggregate(pipeline).exec();

      users.forEach((user, index) => {
        txtBoard += `> ${index + 1}. ${user.name}\n`
        txtBoard += `> 💬 Всего MSG: ${user.totalMsg}\n\n`;
      });
      txtBoard += '                                              🐾';

    } else {
      const VUser = await sck1.findOne({ id: botNumber });
      const sender = await sck1.findOne({ id: citel.chat });

      if (VUser && sender) {
        if (VUser.msg >= sender.msg) {
          txtBoard += `> 🥇 ${VUser.name}\n> 💬 Всего MSG: ${VUser.msg}\n\n`;
          txtBoard += `> 🥈 ${sender.name}\n> 💬 Всего MSG: ${sender.msg}\n`;
        } else {
          txtBoard += `> 🥇 ${sender.name}\n> 💬 Всего MSG: ${sender.msg}\n\n`;
          txtBoard += `> 🥈 ${VUser.name}\n> 💬 Всего MSG: ${VUser.msg}\n`;
        }
      } else if (VUser !== null) {
        txtBoard += `> 🥇 ${VUser.name}\n> 💬 Всего MSG: ${VUser.msg}\n`;
      } else if (sender !== null) {
        txtBoard += `> 🥇 ${sender.name}\n> 💬 Всего MSG: ${sender.msg}\n`;
      } else {
        txtBoard += `> 🥇 ${sender ? sender.name : 'Unknown'}\n> 💬 Всего MSG: 0\n\n`;
        txtBoard += `> 🥈 ${VUser ? VUser.name : 'Unknown'}\n> 💬 Всего MSG: 0\n`;
      }
    }

    citel.react('✅');
    await Void.sendMessage(citel.chat, { text: txtBoard }, { quoted: citel });
  } catch (error) {
    citel.reply('❗ *Ошибка*\n\n> Не так быстро!!, Попробуйте ещё раз позже..');
  }
});

cmd({
  pattern: "slot1",
  alias: ["слот1"],
  desc: "казино 1",
  priceMsg: "ставка",
  category: "🎮 Игры",
  level: 4,
  cooldownTime: 5000
}, async ({ Void, citel }) => {
  const user = await sck1.findOne({ id: citel.sender });
  if (user.msg < 0) return citel.reply('У вас нехватает мсг, что-бы играть в казино')
  const groupMetadata = citel.isGroup ? await Void.groupMetadata(citel.chat).catch((e) => { }) : "";
  if (groupMetadata && groupMetadata.id === '120363298850345400@g.us') return await Void.sendMessage(citel.chat, {
    text: "@120363210551136268@g.us",
    contextInfo: {
      groupMentions: [
        {
          groupJid: "120363210551136268@g.us",
          groupSubject: "Кококо пупсик, к сожалению поиграть в DKill не получится, для этого была создана отдельная группа. (Тыкай)"
        }
      ]
    }
  }, { quoted: citel })

  const r_ban = [
    "1 : 2 : 3",
    "1 : 2 : 3",
    "1 : 2 : 3",
    "4 : 3 : 3",
    "1 : 1 : 1",
    "5 : 2 : 5",
    "3 : 5 : 3",
    "1 : 3 : 6",
    "6 : 2 : 7",
    "1 : 6 : 3",
    "6 : 3 : 2",
    "5 : 5 : 6",
    "1 : 5 : 3",
    "4 : 1 : 7",
    "4 : 3 : 2",
    "4 : 3 : 2",
    "7 : 4 : 6",
    "6 : 5 : 1",
    "5 : 7 : 2"
  ];

  const p = Math.floor(19 * Math.random());
  const q = Math.floor(19 * Math.random());
  const r = Math.floor(19 * Math.random());
  const i = r_ban[p];
  const j = r_ban[q];
  const k = r_ban[r];
  let t = i.split(':');
  let tt = j.split(':');
  let ttt = k.split(':');
  let lol = false;

  if ((t[0] === tt[0] && tt[0] === ttt[0]) || (t[1] === tt[1] && tt[1] === ttt[1]) || (t[2] === tt[2] && tt[2] === ttt[2]) || (t[0] === tt[1] && tt[1] === ttt[2]) || (t[2] === tt[1] && tt[1] === ttt[0])) lol = true;

  const isVIP = user && user.infoRoleUsers && user.infoRoleUsers.status === 'VIP';
  const winProbability = isVIP ? 0.3 : 0.2;
  const winAmount = Math.floor(Math.random() * 300);
  const loseAmount = Math.floor(Math.random() * (isVIP ? 300 : 30));

  if (Math.random() < winProbability) {
    eco.giveMsg({ jid: citel.sender, amount: winAmount });
    citel.reply(replies.slotResults(i, j, k, winAmount, true));
  } else {
    eco.takeMsg({ jid: citel.sender, amount: loseAmount });
    citel.reply(replies.slotResults(i, j, k, loseAmount, false));
  }
});

cmd({
  pattern: "slot2",
  alias: ["слот2"],
  desc: "казино №2",
  priceMsg: "ставка",
  category: "🎮 Игры",
  level: 14,
  cooldownTime: 5000
}, async ({ Void, citel, text }) => {
  const user = await sck1.findOne({ id: citel.sender });
  if (citel.isGroup) {
    const groupMetadata = await Void.groupMetadata(citel.chat).catch(() => { });
    if (groupMetadata && groupMetadata.id === '120363298850345400@g.us') {
      return await Void.sendMessage(citel.chat, {
        text: "@120363210551136268@g.us",
        contextInfo: {
          groupMentions: [
            {
              groupJid: "120363210551136268@g.us",
              groupSubject: "Кококо пупсик, к сожалению поиграть в DKill не получится, для этого была создана отдельная группа. (Тыкай)"
            }
          ]
        }
      }, { quoted: citel });
    }
  }

  const betAmountText = text.split(' ')[0].trim();
  const betAmount = parseInt(betAmountText);
  if (user.msg < betAmount) return citel.reply('У тебя нету столько мсг');
  if (isNaN(betAmount) || betAmount <= 0) return citel.reply('Неверная ставка');

  const reactions = {
    1: "👍", 2: "❤️", 3: "😂", 4: "🤣", 5: "🎉", 6: "😮", 7: "👏", 8: "⭐", 9: "🔥", 10: "🎉",
    11: "😌", 12: "😁", 13: "😉", 14: "😄", 15: "😍", 16: "👍", 17: "🤔", 18: "😐", 19: "😑", 20: "🤐",
    21: "🤨", 22: "🧐", 23: "😴", 24: "🤫", 25: "😢", 26: "😡", 27: "😭", 28: "👎", 29: "😕", 30: "😞",
    31: "😟", 32: "☹️", 33: "😧", 34: "😬", 35: "🤦", 36: "🙄", 37: "😱", 38: "😩", 39: "😘", 40: "🤗",
    41: "🙏", 42: "✌️", 43: "😎", 44: "🤓", 45: "🤡", 46: "🤖", 47: "👽", 48: "👻", 49: "💀", 50: "💩",
    51: "😈", 52: "😇", 53: "💯", 54: "👌", 55: "💪", 56: "👋", 57: "❌", 58: "✔️"
  };

  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const getRandomStickers = (reactions, count = 4) => {
    const keys = Object.keys(reactions);
    const stickers = new Set();
    while (stickers.size < count) {
      stickers.add(getRandomElement(keys));
    }
    return Array.from(stickers).map(key => reactions[key]);
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const getWeightedRandomTime = () => {
    const times = [
      5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
      6, 6, 6, 6, 6, 6, 6,
      7, 7, 7, 7, 7, // 7 секунд выпадает чаще всего
      8, 8, 8, // 8 секунд
      9, 9, // 9 секунд
      10,
      11,
    ];
    return getRandomElement(times);
  };

  const uniqueStickers = getRandomStickers(reactions);
  const chosenSticker = getRandomElement(Object.values(reactions));
  const stickers = shuffleArray([...uniqueStickers, chosenSticker]);

  const reactionTime = getWeightedRandomTime() * 1000; // Преобразовать в миллисекунды
  const txt = `_*Найди нужную реакцию из 5: ${stickers}, и поставь сюда реакцию в течение 15 секунд.*_\n\nЕсли я нечего не пишу, ты не угадал!`;
  console.log(`Реакция: ${chosenSticker}, Время: ${reactionTime / 1000} секунд`);

  await Void.waitForReactionSlot(citel, { priceMsg: betAmount, react: chosenSticker, time: reactionTime, replic: txt });
});
// casino naxoi---------------------------------------------------   
cmd({
  pattern: "try",
  alias: ["трай"],
  desc: "удача или неудача",
  category: "Разное",
}, async ({ Void, citel, text }) => {
  const randomValue = Math.random();
  if (randomValue < 0.5) {
    citel.reply(`${text} - удачно`);
  } else {
    citel.reply(`${text} - неудачно`);
  }
});

//donate
cmd({
  pattern: "donate",
  alias: ["пополнить", "донат"],
  category: "🏠 Базовые команды",
  desc: 'магазин RU Secktor WhaBOT',
  level: 1,
}, async ({ Void, citel, text }) => {
  const user = await sck1.findOne({ id: citel.sender })
  switch (text.split(" ")[0]) {
    case 'мсг':
    case 'msg':
      if (!text.split(" ")[1]) return citel.reply(replies.notText({ text: 'donateMSG' }));
      if (text.split(" ")[1] <= "0") return citel.reply(replies.notText({ text: '!<=0' }));

      let coefficient;
      if (text.split(" ")[1] < 100) {
        coefficient = 1000;
      } else if (text.split(" ")[1] >= 100 && text.split(" ")[1] < 200) {
        coefficient = 1100;
      } else if (text.split(" ")[1] >= 200 && text.split(" ")[1] < 400) {
        coefficient = 1300;
      } else {
        coefficient = 4700;
      }
      const msgAmount = text.split(" ")[1] * coefficient;
      const paymentResponse = await createPayment({ status: 'msg', value: text.split(" ")[1], buyer: citel.sender, sumMsg: msgAmount });
      const buttonMessage = {
        text: replies.donate({ status: 'msg', sumRUB: text.split(" ")[1], sumMSG: msgAmount, link: paymentResponse.data.confirmation.confirmation_url }),
        contextInfo: {
          externalAdReply: {
            title: 'Payment-WhaBot',
            body: 'Тут номер Разработчика',
            thumbnailUrl: 'https://vsegda-pomnim.com/uploads/posts/2023-03/1678960382_vsegda-pomnim-com-p-risunki-almazov-foto-58.jpg',
            sourceUrl: `https://wa.me/+${OWNERNUM.split('@')[0]}`
          },
        },
      };

      if (citel.isGroup) {
        citel.reply('Зайди в лс...')
        await Void.sendMessage(citel.sender, buttonMessage, {
          quoted: citel
        })
      } else {
        await Void.sendMessage(citel.chat, buttonMessage, {
          quoted: citel
        })
      };
      break;

    case 'супп':
    case 'supp':
      const textDonate = `Ку, мы являемся практически единственными поставщиками WhatsApp Бота в России.\n\nЕсли хочешь поддержать проект, ты можешь перевести любую сумму на сбер/юмани по номеру 79607142717`
      await Void.sendMessage(citel.chat, { text: textDonate }, { quoted: citel })
      break;

    case 'vip':
    case 'вип':
      if (user.status === 'VIP') return citel.reply('У вас уже есть VIP Статус !!')
      let months = parseInt(text.split(" ")[1]);
      if (!months || months < 1 || months > 12 && months !== 1488) return citel.reply('Купить VIP можно на 1-12 месяцев, используй *.donate vip 1-12*')
      const monthPrices = {
        1: 90,
        2: 119,
        3: 269,
        4: 349,
        5: 429,
        6: 499,
        7: 569,
        8: 639,
        9: 699,
        10: 779,
        11: 869,
        12: 990
      };

      let sumVip = monthPrices[months];

      const response = await createPayment({ status: "VIP", monthsVip: months, value: sumVip, description: `VIP Status buy ${months} Month`, buyer: citel.sender });
      const message = {
        text: replies.donate({ status: "VIP", months: months, sumRUB: sumVip, link: response.data.confirmation.confirmation_url }),
        contextInfo: {
          externalAdReply: {
            title: 'Payment-WhaBot',
            body: 'Тут номер Разработчика',
            thumbnailUrl: 'https://vsegda-pomnim.com/uploads/posts/2023-03/1678960382_vsegda-pomnim-com-p-risunki-almazov-foto-58.jpg',
            sourceUrl: `https://wa.me/+${OWNERNUM.split('@')[0]}`
          },
        },
      }

      await Void.sendMessage(citel.chat, message, { quoted: citel })
      break

    default:
      const chooseOptionMessage = {
        text: replies.donate({ status: 'default' }),
        contextInfo: {
          externalAdReply: {
            title: 'Магазин RU SecktorBOT',
            body: 'Тыкь.',
            thumbnailUrl: 'https://vsegda-pomnim.com/uploads/posts/2023-03/1678960382_vsegda-pomnim-com-p-risunki-almazov-foto-58.jpg',
            sourceUrl: `https://wa.me/+${OWNERNUM.split('@')[0]}`
          },
        },
      };

      if (citel.isGroup) {
        citel.reply('Зайди в лс..')
        await Void.sendMessage(citel.sender, chooseOptionMessage, {
          quoted: citel
        });
      } else {
        await Void.sendMessage(citel.sender, chooseOptionMessage, {
          quoted: citel
        });
      }
  }
});