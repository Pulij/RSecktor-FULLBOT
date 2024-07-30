const events = require('../lib/cmd');
const { cmd, misc, sck1, sck, sleep, getAdmin } = require('../lib')
const { stylizeText } = require('../lib/exif.js')
const { sessionsMap, connectionWhatsApp } = require('../lib/client.js')
const {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
} = require('@whiskeysockets/baileys')

//owner
cmd({
  pattern: "owner",
  alias: ["создатель"],
  category: "🏠 Базовые команды",
  desc: "номер создателя бота",
  level: 1
}, async ({ Void, citel }) => {
  const vcard = `BEGIN:VCARD\n` +
    `VERSION:3.0\n` +
    `FN: ${OWNERNAME}\n` +
    `NICKNAME: ${OWNERNAME}\n` +
    `PHOTO;VALUE=uri:http://www.abc.com/pub/photos/jqpublic.gif\n` +
    `ORG:;\n` +
    `TEL;TYPE=cell;waid=79607142717:79607142717\n` +
    `END:VCARD`
  const buttonMessaged = {
    contacts: { contacts: [{ vcard }] },
    contextInfo: {
      externalAdReply: {
        title: "Номер создателя, понял?",
        body: 'Нажми сюда.',
        thumbnailUrl: `https://klike.net/uploads/posts/2023-02/1675496594_4-11.jpg`,
        mediaType: 2,
        sourceUrl: `https://wa.me/79607142717?text=Ку`,
      },
    },
  };

  await Void.sendMessage(citel.chat, buttonMessaged, { quoted: citel });
});

//help
cmd({
  pattern: "help",
  alias: ["menu", "помощь", "команды"],
  desc: "список команд бота и другая информация",
  category: "🏠 Базовые команды",
  level: 1
}, async ({ Void, citel }) => {
  const user = await sck1.findOne({ id: citel.sender });
  const group = await sck.findOne({ id: citel.chat });
  const groupAdmins = citel.isGroup ? await getAdmin(Void, citel) : false;
  const isAdmins = citel.isGroup ? groupAdmins.includes(citel.sender) : false;
  const categories = ['🏠 Базовые команды', '💸 Экономика', '🌎 Группа', '🎭 Действия', '⭐ Переводчик', '🎙️ Загрузки', '👨‍👨‍👧 Семья', '🤖 Конвертер', '💎 VIP', '🎮 Игры', '⚙️ Настройки'];
  let menuText = '';
  const sections = [];
  for (const category of categories) {
    if (user?.infoRoleUsers?.status !== 'VIP' && user?.infoRoleUsers?.status !== 'isCreator' && category === '💎 VIP') continue;
    const categoryCommands = events.commands.filter(cmd => cmd && cmd.category && cmd.category.includes(category));
    const rows = [];

    for (const cmd of categoryCommands) {
      if (cmd.nsfw && !group?.nsfw) continue;
      let rowText = `${cmd.desc}`;
      if (category === '🎭 Действия') {
        rowText = `(💰 ${cmd.priceMsg} MSG) ${rowText}`;
      } else if (cmd.level > user.level && cmd.priceMsg) {
        rowText = `(🔒 ${cmd.level} LVL, 💰 ${cmd.priceMsg} MSG) ${rowText}`;
      } else if (cmd.level > user.level) {
        rowText = `(🔒 ${cmd.level} LVL) ${rowText}`;
      } else if (cmd.priceMsg) {
        rowText = `(💰 ${cmd.priceMsg} MSG) ${rowText}`;
      } else if (cmd.isAdmins && !isAdmins) {
        rowText = `(❗) ${rowText}`;
      }

      rows.push({
        title: `.${stylizeText(cmd.pattern)}`,
        description: rowText,
        id: ""
      });
    }

    sections.push({
      title: category,
      rows
    });

  }

  menuText += `Привет ${citel.pushName}\n\n`

  const img = await prepareWAMessageMedia({ image: { url: "https://i.ytimg.com/vi/gpzdyqL270s/maxresdefault.jpg" } }, { upload: Void.waUploadToServer });
  let msg = generateWAMessageFromContent(citel.chat, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: { text: menuText },
          footer: { text: '2023-2024\n©Rsecktor_v1.0.6' },
          header: {
            hasMediaAttachment: true,
            imageMessage: img.imageMessage,
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                  title: 'Команды',
                  sections
                })
              },
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: "Покупка VIP",
                  id: ".donate vip 1"
                })
              },
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Создатель🦅",
                  url: "https://wa.me/79201547274",
                  merchant_url: "https://www.google.com"
                })
              },
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Поддержка 👤",
                  url: "https://wa.me/79607142717",
                  merchant_url: "https://www.google.com"
                })
              },
            ],
            messageParamsJson: ''
          }
        }
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
});
//rulBot
cmd({
  pattern: "rulesbot",
  alias: ["rulbot", "правила", "правилабота"],
  desc: 'пользовательское соглашение',
  category: "🏠 Базовые команды",
  level: 1,
}, async ({ Void, citel, text }) => {
  if (citel.isGroup) {
    await Void.sendMessage(citel.chat, { text: replies.rulesBot() }, { quoted: citel })
  } else {
    citel.reply(replies.rulesBot())
  }
})

// Connect
cmd({
  pattern: "connect",
  alias: ["подключить"],
  category: "🏠 Базовые команды",
  desc: 'подключение бота на свой номер, для добавления в группу или же использования как помощника',
  level: 1,
  isPrivate: true,
  cooldownTime: 240000
}, async ({ Void, citel }) => {
  if (!citel.isCreator) return citel.reply('Подключить бота временно нельзя, все новости в .ownergroup')
  try {
    const botNumber = await Void.decodeJid(Void.user.id);
    if (citel.sender === botNumber) return citel.reply(replies.isBot());

    const phoneNumber = citel.sender.replace(/@s\.whatsapp\.net/g, '');
    const sessionsJid = citel.sender;

    await connectionWhatsApp({ phoneNumber, sessionsJid })
    await sleep(2000);
    const codeData = await misc.findOne({ userId: sessionsJid });
    const { key } = await citel.reply(replies.code({ status: 'generate' }));
    await Void.sendMessage(citel.chat, { text: replies.code({ status: 'ready', code: codeData.pCode }), edit: key });
    await Void.sendMessage(citel.chat, { text: replies.code({ status: 'code', code: codeData.pCode }) });
  } catch (error) {
    console.error("Error in connect function:", error);
    citel.reply(replies.error(error));
  }
});

cmd({
  pattern: 'ownergroup',
  alias: ['linkownergroup'],
  category: "🏠 Базовые команды",
  desc: "ссылка на группу создателя"
}, async ({ Void, citel }) => {
  const session = sessionsMap.get('79607142717@s.whatsapp.net')
  if (session) {
    const inviteCode = await session.groupInviteCode('120363144082211816@g.us');
    const inviteLink = 'https://chat.whatsapp.com/' + inviteCode;
    citel.reply(inviteLink)
  }
})