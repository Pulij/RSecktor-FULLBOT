// воробей мой пупс
// Made by Letovsky for Secktor
const { cmd, marrynaxoi, sck1 } = require('../lib');

cmd({
  pattern: "createmarry",
  desc: "отправить заявку на регистрацию брака",
  category: "👨‍👨‍👧 Семья",
  users: true
}, async ({ Void, citel, users }) => {
  const a = await sck1.findOne({ id: citel.sender })
  const b = await sck1.findOne({ id: users })

  if (a.level < 16 || b.level < 16) return citel.reply('Вы не можете создать брак,т.к у вас или у вашей будущей жены нету 16-ого уровня:(')
  if (citel.sender === users) return await citel.reply(`*Ты не можешь сам себе подать заявку на регистрацию брака*`);
  const checkinfo1 = await marrynaxoi.findOne({ id: users }) || await new marrynaxoi({ id: users }).save();
  const checkinfo = await marrynaxoi.findOne({ id: citel.sender }) || await new marrynaxoi({ id: citel.sender }).save();
  if (checkinfo.status === "registered") return await citel.reply(`*Вы к сожалению уже в браке.*`);
  if (checkinfo.status === "init") return await citel.reply(`*Вы уже отправляли запрос, ожидайте ответа... (Отменить запрос - .cancelmarry)*`);
  if (checkinfo1.status === "registered") return await Void.sendMessage(citel.chat, { text: `*@${users.split('@')[0]} уже состоит в браке.*`, mentions: [citel.sender, users] }, { quoted: citel });
  if (checkinfo1.status === "init") return await citel.reply(`*Данный человек отправил кому-то запрос, поэтому с ним нельзя зарегистрировать брак*`);
  if (checkinfo.status === "alone") {
    await Promise.all([
      marrynaxoi.updateOne({ id: citel.sender }, { status: 'init', marrycreator: citel.sender, who: users }),
      marrynaxoi.updateOne({ id: users }, { status: 'init', marrycreator: citel.sender, who: citel.sender }),
    ]);
    const caption = `*Здравствуйте, @${users.split('@')[0]}! Согласны ли вы зарегистрировать брак с @${citel.sender.split('@')[0]}? (Принять - .acceptmarry)*`;
    await Void.sendMessage(citel.chat, { text: caption, mentions: [citel.sender, users] }, { quoted: citel });
  }
});

cmd({
  pattern: "acceptmarry",
  level: 16,
  desc: "принять заявку на регистрацию брака",
  category: "👨‍👨‍👧 Семья",
}, async ({ Void, citel }) => {
  const checkinfo = await marrynaxoi.findOne({ id: citel.sender }) || await new marrynaxoi({ id: citel.sender }).save();
  const a = await sck1.findOne({ id: citel.sender })
  const b = await sck1.findOne({ id: checkinfo.who })
  const allMsg = a.msg + b.msg
  if (checkinfo.marrycreator === citel.sender) return await citel.reply(`*Вы не можете подтвердить брак, так как у вас есть созданное предложение*`);
  if (checkinfo.status === "registered") return await citel.reply(`*Вы уже зарегистрировали брак*`);
  if (checkinfo.status === "alone") return await citel.reply(`*Вам никто не предлагал вступить в брак*`);
  if (checkinfo.status === "init") {
    await Promise.all([
      marrynaxoi.updateOne({ id: citel.sender }, { status: "registered" }),
      marrynaxoi.updateOne({ id: checkinfo.who }, { status: "registered" }),
      sck1.updateOne({ id: citel.sender }, { msg: allMsg }),
      sck1.updateOne({ id: checkinfo.who }, { msg: allMsg })
    ]);
    await citel.reply(`Вы успешно зарегистрировали брак *(.rank)*`);
  }
}
);

cmd({
  pattern: "rejectmarry",
  level: 16,
  desc: "откланить заявку на регистрацию брака",
  category: "👨‍👨‍👧 Семья",
}, async ({ Void, citel }) => {
  const checkinfo = await marrynaxoi.findOne({ id: citel.sender }) || await new marrynaxoi({ id: citel.sender }).save();
  if (checkinfo.marrycreator === citel.sender) return await citel.reply(`*Вы не можете отказать, так как вы создали предложение*`);
  if (checkinfo.status === "alone") return await citel.reply(`*Вы не в браке*`);
  if (checkinfo.status === "registered") return await citel.reply(`*Брак был уже зарегистрирован (для развода .stopmarry)*`);
  if (checkinfo.status === "init") {
    await Promise.all([
      marrynaxoi.updateOne({ id: checkinfo.who }, { status: 'alone', who: 'nope', marrycreator: 'nope' }),
      marrynaxoi.updateOne({ id: citel.sender }, { status: 'alone', who: 'nope', marrycreator: 'nope' }),
    ]);
    await citel.reply(`Вы успешно отказали на запрос о регистрации брака *(.rank)*`);
  }
}
);

cmd({
  pattern: "stopmarry",
  desc: "развестись",
  level: 16,
  category: "👨‍👨‍👧 Семья",
}, async ({ Void, citel }) => {
  const a = await sck1.findOne({ id: citel.sender });
  const checkinfo = await marrynaxoi.findOne({ id: citel.sender }) || await new marrynaxoi({ id: citel.sender }).save();
  if (checkinfo.status === "alone") return await citel.reply(`*Вы не в браке*`);
  if (checkinfo.status === "init") return await citel.reply(`*Введите .cancelmarry для отмены заявки на брак, или .rejectmarry для отказа на заявку на брак.*`);
  if (checkinfo.status === "registered") {
    const halfMsg = Math.floor(a.msg / 2);
    await Promise.all([
      marrynaxoi.updateOne({ id: checkinfo.who }, { status: 'alone', who: 'nope', marrycreator: 'nope' }),
      marrynaxoi.updateOne({ id: citel.sender }, { status: 'alone', who: 'nope', marrycreator: 'nope' }),
      sck1.updateOne({ id: citel.sender }, { msg: halfMsg }),
      sck1.updateOne({ id: checkinfo.who }, { msg: halfMsg })
    ]);
    await citel.reply(`*Вы успешно развелись* (.rank)`);
  }
}
);

cmd({
  pattern: "cancelmarry",
  category: "👨‍👨‍👧 Семья",
  level: 16,
  desc: "отозвать заявку на регистрацию брака"
}, async ({ Void, citel }) => {
  const checkinfo = await marrynaxoi.findOne({ id: citel.sender }) || await new marrynaxoi({ id: citel.sender }).save();
  if (checkinfo.status === "alone") return await citel.reply(`*Вы не подавали заявку на регистрацию брака*`);
  if (checkinfo.status === "registered") return await citel.reply(`*Используйте *.stopmarry* для развода*`);
  if (checkinfo.status === "init") {
    await Promise.all([
      marrynaxoi.updateOne({ id: checkinfo.who }, { status: 'alone', who: 'nope', marrycreator: 'nope' }),
      marrynaxoi.updateOne({ id: citel.sender }, { status: 'alone', who: 'nope', marrycreator: 'nope' }),
    ]);
    await citel.reply(`*Вы успешно отменили заявку*`);
  }
});