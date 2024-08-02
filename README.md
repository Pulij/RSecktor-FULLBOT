# Whatsapp-bot: Репозиторий для разработчиков
Привет, разработчик! Здесь ты узнаешь, **как запускать, изменять или тестировать бота!**

## Быстрый поиск
* [Установка всех нужных программ](#установка-всех-нужных-программ)
* [Запуск бота](#запуск-бота)
* [Разработка плагинов](#разработка-плагинов)
* [API](#api)
* [База данных](#база-данных)

## Установка всех нужных программ

Для начала, тебе нужно настроить среду разработки! Тебе понадобятся: *Node.js, VS Code, Git*.

### Установка Node.js
* Установить Node.js можно по этой [ссылке](https://nodejs.org/dist/v22.5.1/node-v22.5.1-x64.msi). Следуй инструкциям установки.
* После установки перезагрузите ваш ПК.

### Установка VS Code
* Установить VS Code можно на этом [сайте](https://code.visualstudio.com/Download). Следуй инструкциям установки.

### Установка GIT
* Установить Git можно по этой [ссылке](https://github.com/git-for-windows/git/releases/download/v2.46.0.windows.1/Git-2.46.0-64-bit.exe). Следуй инструкциям установки.
* После установки перезагрузите ваш ПК.

## Запуск бота

1. Скопируйте репозиторий с помощью консольной команды:
    ```sh
    git clone https://github.com/Pulij/RSecktor-FULLBOT.git
    ```
2. Перейдите в папку с репозиторием в VS Code.
3. Откройте терминал в VS Code с помощью сочетания клавиш `Ctrl + Shift + \` (или `Ctrl + Shift + Ё`).
4. Установите необходимые зависимости:
    ```sh
    npm i
    ```
5. Запустите бота:
    ```sh
    npm start
    ```
   Если возникнут ошибки, обратитесь к [создателю проекта](https://wa.me/79201547274).

6. Чтобы остановить бота, используйте:
    ```sh
    pm2 delete 0
    ```
   Если pm2 не работает, перезагрузите ваш ПК.

## Разработка плагинов

### Основные функции

* Чтобы вывести пользователю сообщение:
    ```js
    await Void.sendMessage(citel.chat, { text: 'Ваш текст' });
    ```

* Чтобы ответить на сообщение пользователя:
    ```js
    citel.reply('Ваш текст');
    ```

* Чтобы поставить реакцию на сообщение пользователя:
    ```js
    citel.react('Реакция');
    ```

* Чтобы запросить реакцию на сообщение пользователя:
    ```js
    const { reactions, msg } = await Void.waitForReaction(citel, { 
      priceMsg: 39990, 
      replic: 'Покупка банковской карты, сумма - 39990 MSG\n\nДля подтверждения поставьте любую реакцию на данное сообщение!' 
    });
    if (reactions) {
      await sck1.updateOne({ id: citel.sender }, { 'bank.card': true });
      await Void.sendMessage(citel.chat, { text: `_Обработка запроса, пожалуйста, подождите..._`, edit: msg.key });
      await sleep(5000);
      await Void.sendMessage(citel.chat, { text: `Поздравляем с покупкой! Пользуйтесь банком с пользой)`, edit: msg.key });
    }
    ```

### Пример создания команды
```js
cmd({
  pattern: "givemymsg",
  alias: ['датьмоимсг'],
  category: "💸 Экономика",
  desc: "передать свои msg",
  users: true
}, async ({ Void, citel, text, users }) => {
  if (!text) return;
  const checknum = await Void.onWhatsApp(`${users}`);
  let numw = '0@s.whatsapp.net';
  if (checknum[0]) {
    const user = await sck1.findOne({ id: citel.sender });
    const brackcheck = await marrynaxoi.findOne({ id: citel.sender });
    if (brackcheck.who && users === brackcheck.who) return citel.reply('Нельзя переводить валюту тому с кем ты в браке, т.к у вас общий баланс..');
    if (citel.sender === users) return citel.reply('Вы не можете переводить валюту самому себе');
    if (!users) return citel.reply('Используй .givemymsg 1000 @');
    if (user.msg < parseInt(text.split(' ')[0])) return citel.reply(`Вы не можете перевести ${parseInt(text.split(' ')[0])} msg,т.к у вас всего-лишь ${user.msg}`);
    if (parseInt(text.split(' ')[0]) < 0) return citel.reply(`>= 0`);
    
    await eco.giveMyMsg({ jid: citel.sender, mentionedJid: users, amount: parseInt(text.split(' ')[0]) });
    await Void.sendMessage(citel.chat, { text: `Вы передали ${parseInt(text.split(' ')[0])} msg ему @${users.split('@')[0]}`, mentions: [users] }, { quoted: citel });
  } else {
    await Void.sendMessage(citel.chat, { text: `Вы передали ${parseInt(text.split(' ')[0])} msg ему @${numw.split('@')[0]}`, mentions: [numw] }, { quoted: citel });
  }
});
```

## API

* На данный момент система работает только с [Yoo Money](https://yoomoney.ru/).

## База данных

* В качестве базы данных используется [MongoDB](https://www.mongodb.com).
* Файлы настройки базы данных: `group.js`, `marry.js`, `misc.js`, `private.js`, `statistick.js`, `user.js`, `warn.js`.
