const eco = require('../lib/economyFunction/msgFunc.js')
const { cmd, sck1, marrynaxoi } = require("../lib/");
cmd({
  pattern: "delttt",
  alias: ["удалитькн"],
  desc: "удалить комнату крестики - нолики",
  priceMsg: "ставка",
  category: "🎮 Игры"
}, async ({ Void, citel, text, }) => {
  const brak = await marrynaxoi.findOne({ id: citel.sender })
  if (brak.status === 'registered') return

  if (citel.isGroup) {
    const groupMetadata = await Void.groupMetadata(citel.chat).catch(() => { });
    const groupBlocked = '120363144082211816@g.us';
    if (groupMetadata && groupMetadata.id === groupBlocked) return citel.reply(replies.groupBlocked(groupBlocked));
  }

  this.game = this.game || {};
  const room = Object.values(this.game).find((room) =>
    room.id.startsWith("tictactoe") && room.x === citel.chat
  );

  if (room) {
    if (room.state === "PLAYING") {
      const { reactions, msg } = await Void.waitForReaction(citel, { priceMsg: room.stawka, react: '👍', time: 15000 });
      if (reactions) {
        delete this.game[room.id];
        await Void.sendMessage(citel.chat, { text: replies.games({ status: 'delGame', val: room.stawka }), edit: msg.key });
      }
    } else {
      await Void.sendMessage(citel.chat, { text: replies.games({ status: 'delGameNotPrice', val: room.stawka }) });
      delete this.game[room.id];
    }
  } else {
    await Void.sendMessage(citel.chat, { text: replies.games({ status: 'notGame' }) });
  }
});


cmd({
  pattern: "ttt",
  alias: ["кн"],
  category: "🎮 Игры",
  desc: "крестики - нолики",
  priceMsg: "ставка"
}, async ({ Void, citel, text }) => {
  const brak = await marrynaxoi.findOne({ id: citel.sender })
  if (brak.status === 'registered') return
  const groupMetadata = citel.isGroup ? await Void.groupMetadata(citel.chat).catch((e) => { }) : "";
  if (groupMetadata && groupMetadata.id == '120363144082211816@g.us') return await Void.sendMessage(citel.chat, {
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

  let TicTacToe = require("../lib/ttt");
  this.game = this.game ? this.game : {};

  const existingGame = Object.values(this.game).find(room => room.state === "PLAYING" && room.o === citel.chat);
  const existingPlayerXO = Object.values(this.game).find(room =>
    room.game.playerO === citel.sender || room.game.playerX === citel.sender
  );

  if (existingGame) return citel.reply("В этой группе уже идет игра..");
  if (existingPlayerXO) return citel.reply("Доиграйте предыдущую игру, прежде чем начать новую...");

  let stawka = parseInt(text.split(' ')[0]);
  if (!stawka || stawka <= 0) return citel.reply(replies.notText({ text: 'ttt' }))

  const user = await sck1.findOne({ id: citel.sender })
  if (user.msg < stawka) return citel.reply(replies.insufficientBalance(stawka, user.msg));

  let room = Object.values(this.game).find(
    (room) =>
      room.state === "WAITING" && (text ? room.name === text : true)
  );

  if (!room) {
    const { reactions, msg } = await Void.waitForReaction(citel, { replic: '*⚠️ Предупреждение*\n\n> Ставя любую реакцию на это сообщение вы соглашаетесь с тем, что как только кто-то присоедениться к вашей созданной игровой комнате *у вас заберут такое количество MSG, которое вы поставили в ставке и отдадут только в том случае если вы выиграете.*', time: 17500 })
    if (!reactions || reactions && room) return

    room = {
      id: "tictactoe-" + +new Date(),
      x: citel.chat,
      o: "",
      game: new TicTacToe(citel.sender, "o"),
      state: "WAITING",
      stawka: stawka
    };
    if (text) room.name = text;
    await Void.sendMessage(citel.chat, { text: replies.games({ status: "waiting", val: stawka }), edit: msg.key });
    this.game[room.id] = room;
  } else {
    const { reactions, msg } = await Void.waitForReaction(citel, { replic: `*⚠️ Предупреждение*\n\n> Ставя реакцию на это сообщение, вы присоединитесь к созданной комнатой с ставкой ${stawka} MSG. *На время игры у вас будет убрано столько MSG, сколько в ставке.*` })
    if (!reactions) return

    room.stawka = stawka;
    room.o = citel.chat;
    room.game.playerO = citel.sender || citel.mentionedJid[0]
    room.state = "PLAYING";
    let arr = room.game.render().map((v) => {
      return {
        X: "❌",
        O: "⭕",
        1: "1️⃣",
        2: "2️⃣",
        3: "3️⃣",
        4: "4️⃣",
        5: "5️⃣",
        6: "6️⃣",
        7: "7️⃣",
        8: "8️⃣",
        9: "9️⃣",
      }[v];
    });
    let str = `${arr.slice(0, 3).join("  ")}\n${arr.slice(3, 6).join("  ")}\n${arr.slice(6).join("  ")}\n\n*Ставка:* ${stawka}\n*Ходит:* ${["❌", "⭕"][1 * room.game._currentTurn]}\n`;
    str += `⭕: @${room.game.playerO.split("@")[0]}\n`;
    str += `❌: @${room.game.playerX.split("@")[0]}`;
    eco.takeMsg({ jid: room.game.playerO, amount: room.stawka, reason: "Игра крестики нолики" })
    eco.takeMsg({ jid: room.game.playerX, amount: room.stawka, reason: "Игра крестики нолики" })

    await Void.sendMessage(citel.chat, {
      text: str,
      headerType: 4,
      contextInfo: {
        externalAdReply: {
          title: 'Крестики-Нолики',
          body: `ID - ${room.id}`,
          thumbnailUrl: 'https://fonoteka.top/uploads/posts/2021-05/1621901174_4-phonoteka_org-p-fon-dlya-igri-krestiki-noliki-4.jpg',
          sourceUrl: `https://wa.me/+${OWNERNUM}`
        },
      },
      mentions: [room.game.playerO, room.game.playerX],
      edit: msg.key
    });
  }
});

cmd({
  on: "text",
  isGroup: true
}, async ({ Void, citel, text }) => {
  this.game = this.game ? this.game : {};
  let room = Object.values(this.game).find(
    (room) =>
      room.id &&
      room.game &&
      room.state &&
      room.id.startsWith("tictactoe") &&
      [room.game.playerX, room.game.playerO].includes(citel.sender) &&
      room.state == "PLAYING"
  );

  if (room) {
    let ok;
    let isWin = !1;
    let isTie = !1;
    let isSurrender = !1;

    if (!/^([1-9]|(me)?give_up|surr?ender)$/i.test(citel.text)) return;

    if (
      !isSurrender &&
      1 >
      (ok = room.game.turn(
        citel.sender === room.game.playerO,
        parseInt(citel.text) - 1
      ))
    ) {
      citel.reply(
        {
          "-3": "Игра закончилась.",
          "-2": "Ошибка(Сейчас ход противника)",
          "-1": "_Ошибочная позиция_",
          0: "_Ошибочная позиция_",
        }[ok]
      );
      return !0;
    }
    if (citel.sender === room.game.winner) isWin = true;
    else if (room.game.board === 511) isTie = true;
    let arr = room.game.render().map((v) => {
      return {
        X: "❌",
        O: "⭕",
        1: "1️⃣",
        2: "2️⃣",
        3: "3️⃣",
        4: "4️⃣",
        5: "5️⃣",
        6: "6️⃣",
        7: "7️⃣",
        8: "8️⃣",
        9: "9️⃣",
      }[v];
    });
    if (isSurrender) {
      room.game._currentTurn = citel.sender === room.game.playerX;
      isWin = true;
    }
    let winner = isSurrender ? room.game.currentTurn : room.game.winner;
    if (isWin) {
      eco.giveMsg({ jid: winner, amount: room.stawka * 2, reason: "Выигрыш в крестиках ноликах" })
    }
    let str = ``;

    str += arr.slice(0, 3).join("  ") + "\n";
    str += arr.slice(3, 6).join("  ") + "\n";
    str += arr.slice(6).join("  ") + "\n\n";
    str += `*Ставка:* ${room.stawka}\n`;

    str += isWin ?
      `@${winner.split("@")[0]} Поздравляю, ${room.stawka * 2} MSG - твои 🤑\n` :
      isTie ?
        `Игра закончилась в ничью (Никто ничего не получает)\n` :
        `*Ходит:* ${["❌", "⭕"][1 * room.game._currentTurn]}\n`;

    str += `⭕: @${room.game.playerO.split("@")[0]}\n`;
    str += `❌: @${room.game.playerX.split("@")[0]}`;

    if ((room.game._currentTurn ^ isSurrender ? room.x : room.o) !== citel.chat)
      room[room.game._currentTurn ^ isSurrender ? "x" : "o"] = citel.chat;
    if (isWin || isTie) {
      await Void.sendMessage(citel.chat, {
        text: str,
        headerType: 4,
        contextInfo: {
          externalAdReply: {
            title: 'Крестики-Нолики',
            body: `ID - ${room.id}`,
            thumbnailUrl: 'https://fonoteka.top/uploads/posts/2021-05/1621901174_4-phonoteka_org-p-fon-dlya-igri-krestiki-noliki-4.jpg',
            sourceUrl: `https://wa.me/+${OWNERNUM}`
          },
        },
        mentions: [room.game.playerO, room.game.playerX],
      });
    } else {
      await Void.sendMessage(citel.chat, {
        text: str,
        headerType: 4,
        contextInfo: {
          externalAdReply: {
            title: 'Крестики-Нолики',
            body: `ID - ${room.id}`,
            thumbnailUrl: 'https://fonoteka.top/uploads/posts/2021-05/1621901174_4-phonoteka_org-p-fon-dlya-igri-krestiki-noliki-4.jpg',
            sourceUrl: `https://wa.me/+${OWNERNUM}`
          },
        },
        mentions: [room.game.playerO, room.game.playerX],
      });
    }
    if (isTie || isWin) {
      delete this.game[room.id];
    }
  }
});

cmd({
  pattern: "ship",
  alias: ["шип"],
  desc: "шиппер",
  category: '🎭 Действия',
  isGroup: true,
  priceMsg: 10,
}, async ({ Void, citel, text, users }) => {
  const groupMetadata = citel.isGroup ? await Void.groupMetadata(citel.chat).catch((e) => { }) : "";
  const participants = citel.isGroup ? await groupMetadata.participants : "";
  let members = participants.map(u => u.id)
  const percentage = Math.floor(Math.random() * 100)
  async function couple(percent) {
    var text = replies.textShip({ status: 'percent', percent: percent })
    return text
  }
  var shiper;
  if (users) {
    shiper = users
  } else {
    shiper = members[Math.floor(Math.random() * members.length)]
  }
  let caption = replies.textShip({ status: 'check', sender: '@' + citel.sender.split('@')[0], shiper: '@' + shiper.split('@')[0], couple: await couple(percentage) })

  if (citel.sender.split('@')[0] === shiper.split('@')[0]) return citel.reply(replies.textShip({ status: 'sender' }))
  await Void.sendMessage(citel.chat, { text: caption, mentions: [citel.sender, shiper] }, { quoted: citel })
})