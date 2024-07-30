const cron = require('node-cron');
const { marrynaxoi } = require('../database/marry');
const { stat } = require('../database/statistick');
const { sck1 } = require('../database/user');
const { warndb } = require('../database/warn');
//============================================================================================================================
async function updateMessageCounter(userId, chatId, name, firstMsg, lastMsg, gName) {
  try {
    const currentDate = new Date();
    const user = await sck1.findOneAndUpdate(
      { id: userId },
      { $set: { name: name, lastSendMsg: currentDate }, $inc: { msg: 1, allMsg: 1 } },
      { upsert: true, new: true }
    );

    const endDate = new Date(user.infoRoleUsers.endDateVIP);

    // Проверка на окончание VIP-статуса
    if (user.infoRoleUsers.status === 'VIP' && currentDate >= endDate) {
      user.infoRoleUsers.status = "free";
      user.infoRoleUsers.endDateVIP = "-";
      await sck1.updateOne(
        { id: userId },
        {
          $set: {
            'infoRoleUsers.status': "free",
            'infoRoleUsers.endDateVIP': "-"
          }
        }
      );
    }

    const levelUpdatePromise = updateLevel(user);
    const statUpdatePromise = stat.updateOne(
      { userId: userId, chatId: chatId },
      {
        $setOnInsert: {
          name: name,
          gname: gName,
          "data.msg.firstMessage": firstMsg,
          "data.msg.firstMessageSentDate": currentDate.toLocaleString()
        },
        $set: {
          "data.msg.lastMessage": lastMsg,
          "data.msg.lastMessageSentDate": currentDate.toLocaleString()
        },
        $inc: {
          "data.msg.dailyMsg": 1,
          "data.msg.allMsg": 1,
        }
      },
      { upsert: true }
    );

    await Promise.all([levelUpdatePromise, statUpdatePromise]);
    console.log(`Данные для пользователя ${userId} в чате ${chatId} обновлены`);
  } catch (error) {
    console.error('Ошибка при обновлении счетчика сообщений:', error);
  }
}
//============================================================================================================================
async function calcMessagesPerLevel(userId) {
  const user = await sck1.findOne({ id: userId });
  const maxLevel = 50;
  if (user.level >= maxLevel) {
    return Infinity;
  }
  const messagesPerLevel = user.level * 350;
  return messagesPerLevel;
}

async function calcLevelUpPrice(userId) {
  const user = await sck1.findOne({ id: userId });
  const priceMsg = user.level * 1650;
  return priceMsg;
}

async function checkNextLevel(userId) {
  const user = await sck1.findOne({ id: userId });
  const messagesPerLevel = await calcMessagesPerLevel(userId);
  if (messagesPerLevel === Infinity) {
    return `${user.allMsg}/∞`;
  }
  const messagesInCurrentLevel = user.allMsg % messagesPerLevel;
  return `${messagesInCurrentLevel}/${messagesPerLevel}`;
}

async function updateLevel(user) {
  const maxLevel = 50;
  const messagesPerLevel = user.level * 350;

  if (user.allMsg >= messagesPerLevel && user.level < maxLevel) {
    const nextLevel = user.level + 1;

    if (nextLevel > maxLevel) {
      console.log(`Пользователь c id - ${user.id} уже достиг максимального уровня (${maxLevel}).`);
      return;
    }

    await sck1.updateOne({ id: user.id }, { $set: { level: nextLevel, allMsg: 0 } });
    console.log(`Уровень пользователя c id - ${user.id}, обновлен до ${nextLevel}`);
  }
}

//===========================================================================================================================
cron.schedule('0 0 * * *', async () => {
  try {
    const date = new Date();
    const dateUnWarn = new Date(date.setDate(date.getDate() - 7)).toLocaleString();
    const usersWithMarryCreator = await marrynaxoi.find({ status: "registered" });
    const allIDs = usersWithMarryCreator.map(user => user.id);

    const result = await warndb.deleteMany({
      'dateWarn.date': { $lt: dateUnWarn }
    });

    await sck1.updateMany(
      { id: { $in: allIDs } },
      { $inc: { msg: -1000 } }
    );

    await stat.updateMany({}, { $set: { "data.msg.dailyMsg": 0 } });
    console.log('dailyMsg обнулен у всех пользователей.');
    console.log('Successfully updated msg for selected IDs with marrycreator !== "nope".');
    console.log(`Удалено ${result.deletedCount} предупреждений(warns) - старше 7 дней.`);
  } catch (error) {
    console.error('Ошибка при выполнении', error);
  }
});

// Отдельная задача для сброса индексов
cron.schedule('0 0 * * 0', async () => {
  try {
    await stat.collection.dropIndexes();
    console.log('Индексы сброшены');
  } catch (error) {
    console.error('Ошибка при сбросе индексов:', error);
  }
});

cron.schedule('0 * * * *', async () => {
  try {
    const users = await sck1.find({ "bank.card": true });

    const currentTime = new Date();
    const oneHourAgo = new Date(currentTime - (60 * 60 * 1000)); // Рассчитываем время одного часа назад

    const updatePromises = users.map(async (user) => {
      const lastMsgTime = new Date(user.lastSendMsg);

      if (lastMsgTime >= oneHourAgo) {
        let percentage = 0.01; // Default 1% for regular users
        if (user.infoRoleUsers.status === 'VIP' || user.infoRoleUsers.status === 'isCreator') {
          percentage = 0.02; // 2% for VIP users
        }

        const increaseValue = user.bank.sumMsgBank * percentage;
        const roundedIncreaseValue = Math.round(increaseValue);

        const newSumMsgBank = Math.min(user.bank.sumMsgBank + roundedIncreaseValue, user.bank.cell * 100000);

        await sck1.updateOne(
          { id: user.id },
          { $set: { 'bank.sumMsgBank': newSumMsgBank } }
        );
      }
    });

    await Promise.all(updatePromises);

    console.log('Значения депозита пользователей с банковской картой успешно обновлены');
  } catch (error) {
    console.error('Произошла ошибка:', error);
  }
});
//=========================================================================
module.exports = {
  updateLevel,
  updateMessageCounter,
  calcLevelUpPrice,
  calcMessagesPerLevel,
  checkNextLevel
};