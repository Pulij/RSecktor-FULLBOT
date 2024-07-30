require('../_config.js')
const SPAM_THRESHOLD = 1;
const SPAM_INTERVAL = 700;
const userSpamTracker = {};
const lastCommandUsageTimes = new Map();
let groupMetadataCache = {};

const eco = require('../lib/economyFunction/msgFunc.js');
const PhoneNumber = require('awesome-phonenumber');
const colors = require('colors');
const FileType = require('file-type');
const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');
const pino = require('pino');
const pluginsDir = path.join(__dirname, '../commands');
const events = require('./cmd');
const mongoose = require('mongoose');
const { default: VoidConnect, useMultiFileAuthState, makeInMemoryStore, makeCacheableSignalKeyStore, jidDecode, downloadContentFromMessage, getBinaryNodeChild, delay, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./exif');
const { smsg, updateMessageCounter, removeFolder, sck, sck0, sck1, misc, marrynaxoi, getSizeMedia, banAccount, unbanAccount } = require('./');
const sessionsMap = new Map()

async function reloadPlugins() {
  events.commands.length = 0;
  const files = await fs.readdir(pluginsDir);
  files.forEach((file) => {
    const pluginPath = path.join(pluginsDir, file);
    delete require.cache[require.resolve(pluginPath)];
    require(pluginPath);
  });
}

//Подключение/Управление сессиями WhatsAp
async function connectionWhatsApp({ phoneNumber, newSessionName, sessionName }) {
  try {
    await mongoose.connect(MONGODB)
    console.log('🌍 Подключение к WhaBOTDB установлен.')

    let { state, saveCreds } = await useMultiFileAuthState(path.resolve(__dirname, `./sessions/${newSessionName || sessionName}`));
    const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
    const msgRetryCounterCache = new NodeCache();

    const Void = VoidConnect({
      logger: pino({ level: 'silent' }),
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      printQRInTerminal: !USE_PAIRING_CODE,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }).child({ level: 'silent' })),
      },
      msgRetryCounterCache,
    });
    store?.bind(Void.ev);

    let interval = setInterval(() => {
      store.writeToFile(__dirname + `/sessions/${newSessionName || sessionName}/store.json`);
    }, 30 * 1000);


    Void.ev.on('creds.update', saveCreds);

    if (USE_PAIRING_CODE && phoneNumber) {
      await delay(1700);
      const pCode = await Void.requestPairingCode(phoneNumber);
      await delay(500);
      await misc.updateOne({ userId: newSessionName }, { pCode }, { upsert: true });
      console.log(pCode);
    }
    //====================================================================================================================
    Void.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
      } else return jid;
    };

    Void.getName = (jid, withoutContact = false) => {
      id = Void.decodeJid(jid)
      withoutContact = Void.withoutContact || withoutContact
      let v
      if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
        v = store.contacts[id] || {}
        if (!(v.name.notify || v.subject)) v = Void.groupMetadata(id) || {}
        resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
      })
      else v = id === '0@s.whatsapp.net' ? {
        id,
        name: 'WhatsApp'
      } : id === Void.decodeJid(Void.user.id) ?
        Void.user :
        (store.contacts[id] || {})
      return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    Void.downloadMediaMessage = async (message) => {
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(message, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      return buffer
    }

    /**
     *
     * @param {*} jid
     * @param {*} message
     * @param {*} forceForward
     * @param {*} options
     * @returns
     */

    Void.sendImageAsSticker = async (jid, buff, options = {}) => {
      let buffer;
      if (options && (options.packname || options.author)) {
        buffer = await writeExifImg(buff, options);
      } else {
        buffer = await imageToWebp(buff);
      }
      await Void.sendMessage(
        jid,
        { sticker: { url: buffer }, ...options },
        options
      );
    };
    /**
     *
     * @param {*} jid
     * @param {*} path
     * @param {*} quoted
     * @param {*} options
     * @returns
     */

    Void.sendVideoAsSticker = async (jid, buff, options = {}) => {
      let buffer;
      if (options && (options.packname || options.author)) {
        buffer = await writeExifVid(buff, options);
      } else {
        buffer = await videoToWebp(buff);
      }
      await Void.sendMessage(
        jid,
        { sticker: { url: buffer }, ...options },
        options
      );
    };


    Void.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
      try {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const type = await FileType.fromBuffer(buffer);
        const trueFileName = attachExtension ? `${filename}.${type.ext}` : filename;
        await fs.writeFile(trueFileName, buffer);
        return trueFileName;
      } catch (error) {
        console.error('Error downloading and saving media message:', error);
        throw error;
      }
    };

    Void.getFile = async (PATH, save) => {
      let res
      let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
      //if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
      let type = await FileType.fromBuffer(data) || {
        mime: 'application/octet-stream',
        ext: '.bin'
      }
      let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext)
      if (data && save) fs.promises.writeFile(filename, data)
      return {
        res,
        filename,
        size: await getSizeMedia(data),
        ...type,
        data
      }

    }

    Void.sendAcceptInviteV4 = async (jid, users, addinfo, caption = "Кто-то пытается добавить тебя используя бота") => {
      const groupMetadata = await Void.groupMetadata(jid);
      const groupName = groupMetadata ? groupMetadata.subject : "";

      const id = Void.decodeJid(jid);

      if (!id.endsWith("g.us")) {
        throw new TypeError("Invalid jid");
      }

      const result = getBinaryNodeChild(addinfo, "add_request");
      const inviteCode = result.attrs.code;
      const inviteExpiration = result.attrs.expiration;
      const content = proto.Message.fromObject({
        groupInviteMessage: proto.Message.GroupInviteMessage.fromObject({
          inviteCode,
          inviteExpiration,
          groupJid: jid,
          groupName: groupName,
          caption
        })
      });

      const waMessage = generateWAMessageFromContent(users, content, {
        userJid: Void.decodeJid(Void.user.id),
        ephemeralExpiration: 3 * 24 * 60 * 60
      });

      process.nextTick(() => {
        Void.upsertMessage(waMessage, "append");
        Void.relayMessage(users, waMessage.message, {
          messageId: waMessage.key.id,
          cachedGroupMetadata: (jid) => Void.groupMetadata(jid)
        });
      });

      return waMessage;
    };

    Void.waitForReaction = async (citel, { replic, priceMsg, priceLvl, delafexec = false, react, time = 15000 }) => {
      return new Promise(async (resolve, reject) => {
        try {
          const DBUser1 = await sck1.findOne({ id: citel.sender });

          if (priceLvl > DBUser1.level) {
            Void.sendMessage(citel.chat, { text: `Стоимость данной команды *${priceLvl} lvl*, у вас всего-лишь *${DBUser1.level} lvl*` }, { quoted: citel });
            return;
          }

          const msg = await citel.reply(replic || replies.questMSG({ msg: priceMsg, react, time }));
          let reactionReceived = false;
          let timeoutId;

          const clearListener = () => {
            clearTimeout(timeoutId);
            Void.ev.off('messages.upsert', listener);
          };

          const handleReaction = async (update) => {
            const mek = update.messages[0];
            const reactionMessage = mek?.message?.reactionMessage || mek?.reactionMessage;
            let botNumber;
            if (Void?.user?.id) {
              botNumber = await Void.decodeJid(Void.user.id);
            }
            let kitel = await smsg(Void, JSON.parse(JSON.stringify(mek)), store);
            if (kitel.sender === undefined) kitel.sender = botNumber;

            if (reactionMessage?.key.id === msg.key.id && citel.sender === kitel.sender) {
              if (react && reactionMessage.text !== react) return;

              if (priceMsg && DBUser1.msg < priceMsg) {
                await Void.sendMessage(citel.chat, { text: `[ error: Не хватает валюты (Стоимость команды - ${priceMsg}, у вас всего - ${DBUser1.msg})]`, edit: msg.key });
                clearListener();
                return;
              }

              if (priceMsg) eco.takeMsg({ jid: citel.sender, amount: priceMsg });
              if (priceLvl) eco.takeLvl({ jid: citel.sender, amount: priceLvl });

              reactionReceived = true;
              resolve({ reactions: reactionMessage, msg });
              clearListener();

              if (delafexec) await Void.sendMessage(citel.chat, { delete: msg.key });
            }
          };

          const listener = async (update) => handleReaction(update);

          timeoutId = setTimeout(async () => {
            if (!reactionReceived) {
              reject();
              await Void.sendMessage(citel.chat, { text: replies.questMSG({ time, noReact: true }), edit: msg.key });
              clearListener();
            }
          }, time);

          Void.ev.on('messages.upsert', listener);

        } catch (error) {
          console.error('Ошибка при ожидании реакции:', error);
          reject(error);
        }
      });
    };

    Void.metadataGroup = async (chatId) => {
      if (chatId.endsWith('@g.us')) {
        try {
          if (!(chatId in groupMetadataCache)) {
            groupMetadataCache[chatId] = await Void.groupMetadata(chatId);
          }
          return groupMetadataCache[chatId];
        } catch (e) {
          return;
        }
      } else {
        return 'privateChat';
      }
    };

    Void.waitForReactionSlot = async (citel, { replic, priceMsg, delafexec = false, react, sSmail, time = 10000 }) => {
      return new Promise(async (resolve, reject) => {
        try {
          const DBUser1 = await sck1.findOne({ id: citel.sender });
          const msg = await citel.reply(replic);
          let reactionReceived = false;
          let timeoutId;

          const clearListener = () => {
            clearTimeout(timeoutId);
            Void.ev.off('messages.upsert', listener);
          };

          const handleReaction = async (update) => {
            const mek = update.messages[0];
            const reactionMessage = mek?.message?.reactionMessage || mek?.reactionMessage;
            let botNumber;
            if (Void?.user?.id) {
              botNumber = await Void.decodeJid(Void.user.id);
            }
            let kitel = await smsg(Void, JSON.parse(JSON.stringify(mek)), store);
            if (kitel.sender === undefined) kitel.sender = botNumber;

            if (reactionMessage?.key.id === msg.key.id && citel.sender === kitel.sender) {
              if (react && reactionMessage.text !== react) return;

              if (DBUser1.msg < 0) {
                await Void.sendMessage(citel.chat, { text: `Ошибка: Не хватает валюты (ваша ставка - ${priceMsg}, а у вас всего - ${DBUser1.msg})`, edit: msg.key });
                clearListener();
                return;
              }
              if (priceMsg) eco.giveMsg({ jid: citel.sender, amount: priceMsg * 2 });
              await Void.sendMessage(citel.chat, { text: `Поздравляю, ты выиграл ${priceMsg * 2} MSG`, edit: msg.key });
              reactionReceived = true;
              resolve({ reactions: reactionMessage, msg });
              clearListener();

              if (delafexec) await Void.sendMessage(citel.chat, { delete: msg.key });
            }
          };

          const listener = async (update) => handleReaction(update);

          timeoutId = setTimeout(async () => {
            if (!reactionReceived) {
              reject();
              eco.takeMsg({ jid: citel.sender, amount: priceMsg })
              const tt = 15000
              await Void.sendMessage(citel.chat, { text: replies.questMSGSlot({ time: tt, noReact: true }), edit: msg.key });
              clearListener();
            }
          }, time);

          Void.ev.on('messages.upsert', listener);

        } catch (error) {
          console.error('Ошибка при ожидании реакции:', error);
          reject(error);
        }
      });
    };
    //==================================================================================================================
    //Отслеживание соединения с WhatsApp
    Void.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, isNewLogin } = update;
      let botNumber;
      if (Void?.user?.id) botNumber = await Void.decodeJid(Void.user.id);
      const isNewLog = isNewLogin;

      // Обработка различных состояний подключения
      switch (connection) {
        case 'connecting':
          console.log('🌍 Подключение к WhatsApp... Пожалуйста, подождите.');
          break;

        case 'open':
          console.log('⬇️ Загрузка...');
          console.log('✅ Загрузка завершена!');
          break;

        case 'close':
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode;
          console.log(shouldReconnect);

          if (shouldReconnect === 515) {
            const map = await connectionWhatsApp({ newSessionName });
            sessionsMap.set(newSessionName, map)
          } else if ([401, 405, 403].includes(shouldReconnect) || lastDisconnect?.error?.message === 'QR refs attempts ended') {
            Void.logout();
            await removeFolder(`${__dirname}/sessions/${sessionName || newSessionName}`);
            clearInterval(interval);
          } else {
            const map = await connectionWhatsApp({ sessionName });
            sessionsMap.set(sessionName, map)
          }
          break;

        default:
          break;
      }
    });
    //========================================================================================================================================
    //Обработка входящих сообщений 
    Void.ev.on('messages.upsert', async (chatUpdate) => {
      const mek = chatUpdate.messages[0];
      if (!mek.message || mek.message.viewOnceMessageV2) return;
      mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
      if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
      try {
        let botNumber;
        if (Void?.user?.id) {
          botNumber = await Void.decodeJid(Void.user.id);
        }
        let citel = await smsg(Void, JSON.parse(JSON.stringify(mek)), store);
        if (citel.sender === undefined) citel.sender = botNumber;

        const checkOwnerBot = await sck1.find({ "infoRoleUsers.status": "isCreator" });
        citel.isCreator = checkOwnerBot.length > 0 && checkOwnerBot.some(user => user.id === citel.sender);

        const groupMetadata = await Void.metadataGroup(citel.chat);
        if (groupMetadata) citel.gName = groupMetadata.subject;

        var { body } = citel;
        var budy = typeof citel.text == "string" ? citel.text : false;
        if (body[1] && body[1] == " ") body = body[0] + body.slice(2);
        let icmd = body ? body.trim().startsWith(PREFIX) && body.trim().length > PREFIX.length : false;

        // Распределение ботов в групповых чатах
        const participants = citel.isGroup && groupMetadata && groupMetadata.participants !== undefined ? groupMetadata.participants : [];
        const description = groupMetadata && groupMetadata.desc ? groupMetadata.desc : "Описание отсутствует";

        if (citel.isGroup) {
          try {
            const match = /\[ bot: (\d+@s\.whatsapp\.net) \]/.exec(description);
            if (!match && icmd) {
              await Void.sendMessage(botNumber, { text: replies.infoBotGroup(botNumber) }, { quoted: citel });
              await Void.sendMessage(botNumber, { text: `[ bot: ${botNumber} ]` }, { quoted: citel });
              return;
            } else if (botNumber !== match[1]) return;
          } catch (e) {
            return;
          }
        }

        const regex = /(\d+)@s.whatsapp.net/;
        const match = regex.exec(citel.chat);
        const files = await fs.readdir(path.join(__dirname, 'sessions'), { withFileTypes: true });
        const sessionsJid = files
          .filter(entry => entry.isDirectory())
          .map(directory => directory.name);

        const botSe = sessionsJid.includes(citel.chat);
        if (match && botSe && citel.sender === botNumber && citel.sender !== citel.chat) return;

        const groupAdminss = async (participants) => {
          const a = [];
          for (let i of participants) {
            if (i.admin == null) continue;
            a.push(i.id);
          }
          return a;
        };

        const DBUser = await sck1.findOne({ id: citel.sender }) || await sck1.updateOne({ id: citel.sender }, { name: citel.pushName });
        let DBPrivate, DBGroup;

        if (citel.chat.endsWith('@g.us')) {
          DBGroup = await sck.findOne({ id: citel.chat }) || await new sck({ id: citel.chat }).save();
        } else if (citel.chat.endsWith('@s.whatsapp.net')) {
          DBPrivate = await sck0.findOne({ id: citel.chat }) || await new sck0({ id: citel.chat }).save();
        }

        if (!citel.message || citel.isBaileys || citel.chat.endsWith('broadcast')) return
        if (icmd && DBUser && DBUser?.dateBan?.ban && !citel.isCreator) return citel.reply(replies.userBan({ reason: DBUser.dateBan.reasonBan, dateUnban: DBUser.dateBan.dateUnban }));
        if (DBUser && DBUser?.dateBan?.ban) return;
        if (DEV && !citel.isCreator && icmd && DBGroup?.role !== 'Dev' && citel.isGroup) return;
        if (icmd && !groupMetadata.owner && citel.isGroup && !DBGroup.botenable || icmd && !citel.isGroup && !DBPrivate.botenable && citel.sender !== botNumber) return;
        if (!citel.body && !citel.message.stickerMessage) return;

        if (citel.sender) {
          if (citel.isGroup) {
            await updateMessageCounter(citel.sender, citel.chat, citel.pushName, citel.body, citel.body, citel.gName);
          } else {
            if (citel.sender === citel.chat) {
              await updateMessageCounter(citel.sender, botNumber, citel.pushName, citel.body, citel.body, citel.gName);
            } else {
              await updateMessageCounter(citel.sender, citel.chat, citel.pushName, citel.body, citel.body, citel.gName);
            }
          }
        }

        const groupAdmins = citel.isGroup ? await groupAdminss(participants) : '';
        const isAdminsBot = citel.isGroup ? groupAdmins.includes(botNumber) : false;
        const isAdmins = citel.isGroup ? groupAdmins.includes(citel.sender) : false;

        //Антиспам/Антифлуд
        if (DBUser.dateBan && DBUser.dateBan.ban && DBUser.dateBan.typeBan !== 'perma' && new Date() >= new Date(DBUser.dateBan.dateUnban)) await unbanAccount()
        try {
          if (!userSpamTracker[citel.sender]) {
            userSpamTracker[citel.sender] = { count: 1, lastTimestamp: Date.now() };
          } else {
            const { count, lastTimestamp } = userSpamTracker[citel.sender];
            const currentTime = Date.now();

            if (currentTime - lastTimestamp < SPAM_INTERVAL) {
              userSpamTracker[citel.sender].count++;

              if (userSpamTracker[citel.sender].count > SPAM_THRESHOLD && !citel.isBaileys && !citel?.message?.reactionMessage && !citel.isCreator) {
                console.log(colors.blue(`Spam Detected! (${userSpamTracker[citel.sender].count} messages in ${SPAM_INTERVAL / 1000} seconds from "${citel.sender}")`));

                const DBUser = await sck1.findOne({ id: citel.sender });

                if (DBUser && DBUser.msg >= userSpamTracker[citel.sender].count) {
                  await eco.takeMsg({ jid: citel.sender, amount: userSpamTracker[citel.sender].count, reason: "Spam/Flud" });
                  await sck1.updateOne({ id: citel.sender }, { $inc: { allMsg: -userSpamTracker[citel.sender].count } });
                } else {
                  console.log(colors.red(`User ${citel.sender} doesn't have enough msg for spam payment. Banning...`));

                  const currentDate = new Date();
                  const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Дата через 7 дней
                }
              }
            } else {
              const checkinfo = await marrynaxoi.findOne({ id: citel.sender }) || await new marrynaxoi({ id: citel.sender }).save();
              if (checkinfo.status === 'registered') {
                await sck1.updateOne(
                  { id: checkinfo.who },
                  { msg: DBUser.msg + 1 }
                )
              }
              userSpamTracker[citel.sender] = { count: 1, lastTimestamp: currentTime };
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
        //========================================================================================
        //Обработка плагинов
        const args = citel.body ? body.trim().split(/ +/).slice(1) : null;
        const cmdName = icmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
        const cmd = events.commands.find(cmd => (cmd.pattern === cmdName) || (cmd.alias && cmd.alias.includes(cmdName)));
        let text;
        try {
          text = citel.body ? body.trim().split(/ +/).slice(1).join(" ") : null;
        } catch {
          text = false;
        }

        const users = citel.mentionedJid && citel.mentionedJid[0] || citel.quoted && citel.quoted.sender || (text && text.replace(/[^0-9]/g, '') + "@s.whatsapp.net") || false;
        async function executeCommand(cmd, citel) {
          try {
            if (cmd.cooldownTime) {
              const currentTime = Date.now();
              const lastConnectCommandTime = lastCommandUsageTimes.get(citel.chat) || 0;
              const timeElapsed = currentTime - lastConnectCommandTime;

              if (timeElapsed < cmd.cooldownTime) {
                const remainingTime = cmd.cooldownTime - timeElapsed;
                const remainingHours = Math.floor(remainingTime / 3600000);
                const remainingMinutes = Math.floor((remainingTime % 3600000) / 60000);
                const remainingSeconds = Math.floor((remainingTime % 60000) / 1000);

                let remainingTimeString = "";
                if (remainingHours > 0) remainingTimeString += `${remainingHours} часов `;
                if (remainingMinutes > 0) remainingTimeString += `${remainingMinutes} минут `;
                if (remainingSeconds > 0) remainingTimeString += `${remainingSeconds} секунд`;

                return citel.reply(`*❗ Ошибка*\n\n> Данная команда доступна раз в ${cmd.cooldownTime} мс, повторите попытку через - *${remainingTimeString}*`);
              }

              lastCommandUsageTimes.set(citel.chat, currentTime);
            }

            if (cmd.isCreator && !citel.isCreator) return citel.react('❌');
            if (cmd.botNumber && citel.sender !== botNumber) return citel.reply(replies.notBotNumber());
            if (cmd.isGroup && !citel.isGroup) return citel.reply(replies.notGroup());
            if (cmd.isPrivate && citel.isGroup) return citel.reply(replies.isPrivate());
            if (cmd.isAdmins && !isAdmins && !citel.isCreator) return citel.reply(replies.isAdmins());
            if (cmd.botAdmins && !isAdminsBot) return citel.reply('у меня нету админки');
            if (cmd.users && !users) return citel.reply(replies.notUser());
            if (cmd.level && DBUser.level < cmd.level) return citel.reply(replies.notLvl({ lvl: cmd.level, msg: cmd.priceMsg }));
            if (cmd.isVip && DBUser.infoRoleUsers.status !== 'VIP' && !citel.isCreator) return citel.reply('Данная команда, доступна только для VIP пользователей - .donate vip 1');
            if (citel.isGroup && cmd.nsfw && (!DBGroup || !DBGroup.nsfw)) return citel.react('❌');
            if (cmd.priceMsg && typeof cmd.priceMsg !== 'string') {
              if (DBUser.msg > cmd.priceMsg * 2 && DBUser.infoRoleUsers.status !== 'VIP') {
                await eco.takeMsg({ jid: citel.sender, amount: cmd.priceMsg * 2 });
              } else if (DBUser.msg > cmd.priceMsg && DBUser.infoRoleUsers.status === 'VIP') {
                await eco.takeMsg({ jid: citel.sender, amount: cmd.priceMsg });
              } else {
                return citel.reply(replies.notMsg({ senderMSG: DBUser.msg, msg: cmd.priceMsg }));
              }
            }

            if (cmd.react) citel.react(cmd.react);
            await cmd.function({ Void, citel, text, users, botNumber, args, body, budy });
          } catch (error) {
            console.error('Ошибка при выполнении команды:', error);
          }
        }

        try {
          const args = citel.body ? body.trim().split(/ +/).slice(1) : [];
          const cmdName = icmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : '';
          const cmd = events.commands.find(cmd => (cmd.pattern === cmdName) || (cmd.alias && cmd.alias.includes(cmdName)));

          if (cmd) {
            await executeCommand(cmd, citel);
          }

          events.commands.map(async (command) => {
            if (body && command.on === "body") {
              command.function({ Void, citel, args, icmd, body, budy });
            } else if (citel.text && command.on === "text") {
              command.function({ Void, citel, args, icmd, body, budy });
            } else if (
              (command.on === "image" || command.on === "photo") &&
              citel.mtype === "imageMessage"
            ) {
              command.function({ Void, citel, args, icmd, body, budy });
            } else if (
              command.on === "sticker" &&
              citel.mtype === "stickerMessage"
            ) {
              command.function({ Void, citel, args, icmd, body, budy });
            }
          });
        } catch (error) {
          console.error('Ошибка при обработке команд:', error);
        }

        // Лог сообщений
        if (!citel.isGroup) {
          if (cmd) console.log(colors.yellow(`Команда в личке\nОт=> ${citel.pushName} (${citel.sender})\nКоманда: ${citel.body}\n----------------------------`));
          else console.log(`Сообщение в личке\nОт=> ${citel.pushName} (${citel.sender})\nСообщение: ${citel.body}\n----------------------------`);
        } else {
          if (cmd) console.log(colors.yellow(`Команда в группе\nВ=> ${groupMetadata.subject} (${citel.sender})\nКоманда: ${citel.body}\n----------------------------`));
          else console.log(`Сообщение в группе\nВ=> ${groupMetadata.subject} (${citel.sender})\nСообщение: ${citel.body}\n----------------------------`);
        }
        //=======================Antilink
        try {
          const group = await sck.findOne({ id: citel.chat });
          if (group && citel.isGroup && !isAdmins && group.antilink) {
            const antilink = 'https://chat.whatsapp.com/';
            const messageLower = citel.body.toLowerCase();

            // Проверяем на наличие ссылки 'https://chat.whatsapp.com/'
            if (messageLower.includes(antilink)) {
              const inviteResponse = await Void.groupInviteCode(citel.chat);
              const inviteLink = `https://chat.whatsapp.com/${inviteResponse}`;
              const invitePattern = new RegExp(`\\b${inviteLink}\\b`, 'ig');

              // Проверяем если это не ссылка-приглашение текущей группы
              if (!invitePattern.test(messageLower)) {
                const deleteKey = {
                  remoteJid: citel.chat,
                  fromMe: false,
                  id: citel.id,
                  participant: citel.sender
                };

                await Void.sendMessage(citel.chat, { delete: deleteKey });
                await Void.groupParticipantsUpdate(citel.chat, [citel.sender], 'remove');
              }
            }
          }
        } catch (err) {
          console.error('Error in antilink functionality:', err);
        }
        //==============console
        if (citel.text.startsWith('>') && citel.isCreator) {
          const code = budy.slice(2);
          if (!code) {
            return citel.reply(`Дай команду...`);
          }
          try {
            const resultTest = eval(code);
            citel.reply(`Результат: ${JSON.stringify(resultTest, null, 2)}`);
          } catch (err) {
            citel.reply(`Ошибка: ${err.name} - ${err.message}\nStack trace: ${err.stack}`);
          }
        }
      } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);
      }
    });
    //========================================================================================================================================
    //Отслеживание обновления групповых чатов
    Void.ev.on('group-participants.update', async (anu) => {
      try {
        const group = await sck.findOne({ id: anu.id });
        if (!group) return;

        let botNumber;
        if (Void?.user?.id) botNumber = await Void.decodeJid(Void.user.id);

        const metadata = await Void.metadataGroup(anu.id);
        if (!metadata) return;

        const totalmem = metadata.participants.length;
        const description = metadata.desc ? metadata.desc : "Описание отсутствует";

        const match = /\[ bot: (\d+@s\.whatsapp\.net) \]/.exec(description);
        if (!match || botNumber !== match[1]) return;

        // Обработка различных действий с участниками группы
        switch (anu.action) {
          case 'demote':
            if (group.removeAdminSwitch) {
              const text = `✏️ Понижение !\n\n> Администратор @${anu.author.split('@')[0]}, понизил пользователя @${anu.participants[0].split('@')[0]}`;
              await Void.sendMessage(anu.id, { text, mentions: [anu.author, anu.participants[0]] });
            }
            break;

          case 'promote':
            if (group.removeAdminSwitch) {
              const text = `✏️ Повышение !\n\nАдминистратор @${anu.author.split('@')[0]}, повысил пользователя @${anu.participants[0].split('@')[0]}`;
              await Void.sendMessage(anu.id, { text, mentions: [anu.author, anu.participants[0]] });
            }
            break;

          case 'add':
            if (group.events) {
              for (let num of anu.participants) {
                const welcomeMessage = group.welcome ? group.welcome.replace(/@user/gi, `@${num.split("@")[0]}`).replace(/@gname/gi, metadata.subject).replace(/@desc/gi, metadata.desc).replace(/@count/gi, totalmem) : '';
                await Void.sendMessage(anu.id, { text: welcomeMessage.trim(), mentions: [num] });
              }
            }
            break;

          case 'remove':
            if (group.events) {
              for (let num of anu.participants) {
                const goodbyeMessage = group.goodbye ? group.goodbye.replace(/@user/gi, `@${num.split("@")[0]}`).replace(/@gname/gi, metadata.subject).replace(/@desc/gi, metadata.desc).replace(/@count/gi, totalmem) : '';
                await Void.sendMessage(anu.id, { text: goodbyeMessage.trim(), mentions: [num] });
              }
            }
            break;

          default:
            break;
        }
      } catch (error) {
        console.error('Ошибка при обработке обновления участников группы:', error);
      }
    });

    return Void;
  } catch (error) {
    console.error(error)
    process.exit(1);
  }
}
//==========================================================================================================================================
connectionWhatsApp({ sessionName: "79607142717@s.whatapp.net" })
reloadPlugins()
setInterval(() => {
  cachedGroupMetadata = {};
}, 60000)
module.exports = { connectionWhatsApp, sessionsMap };