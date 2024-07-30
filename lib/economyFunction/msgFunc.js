const { sck1 } = require('..');

const eco = {
  giveMyMsg: async function ({ jid, mentionedJid, amount, reason }) {
    await sck1.updateOne({ id: jid }, { $inc: { msg: -amount } });
    await sck1.updateOne({ id: mentionedJid }, { $inc: { msg: amount } });
    console.log(`Пользователь с id: ${jid} передал пользователю с id: ${mentionedJid} - ${amount} MSG`)
  },

  takeMsg: async function ({ jid, amount, reason }) {
    await sck1.updateOne({ id: jid }, { $inc: { msg: -amount } });
    console.log(`Пользователю с id: ${jid} - было убрано ${amount} MSG`);
  },

  takeLvl: async function ({ jid, amount, reason }) {
    await sck1.updateOne({ id: jid }, { $inc: { level: -amount } })
  },

  giveMsg: async function ({ jid, amount, reason }) {
    await sck1.updateOne({ id: jid }, { $inc: { msg: amount } });
    console.log(`Пользователю с id: ${jid} - было выдано ${amount} MSG`);
  },

  setMsg: async function ({ jid, amount, reason }) {
    await sck1.updateOne({ id: jid }, { msg: amount });
    return console.log(`Пользователю с id: ${jid} - было установлено ${amount} MSG`);
  },

  setLvl: async function ({ jid, amount, reason }) {
    await sck1.updateOne({ id: jid }, { level: amount })
  },

  giveLvl: async function ({ jid, amount, reason }) {
    await sck1.updateOne({ id: jid }, { $inc: { level: amount } })
  },
};

module.exports = eco;