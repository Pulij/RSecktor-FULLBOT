const express = require('express')
const router = express.Router()
const { sck1, marrynaxoi } = require('..');

router.post('/webhook', async (req, res) => {
    const sessionsMap = req.app.locals.sessionsMap;
    const session = sessionsMap.get('79607142717@s.whatsapp.net');
    if (!session) return res.status(500).json({ error: "Внутренняя ошибка сервера RSeck" });
    try {
        const { event, object } = req.body;
        if (event !== 'payment.succeeded') return res.status(400).send('Unsupported event type.');

        const buyerId = object.metadata.buyer;
        const status = object.metadata.status;
        const sumMsg = parseInt(object.metadata.sumMsg);
        const monthsVip = parseInt(object.metadata.monthsVip);
        const amount = parseInt(object.amount.value);
        if (!buyerId || !status || !amount) return res.status(400).send('Invalid metadata in request.');

        const user = await sck1.findOne({ id: buyerId });
        const checkinfo = await marrynaxoi.findOne({ id: buyerId });

        if (status === 'msg') {
            await sck1.updateOne({ id: buyerId }, { $inc: { msg: sumMsg } });
            if (checkinfo && checkinfo.status === 'registered') {
                await sck1.updateOne({ id: checkinfo.who }, { $inc: { msg: sumMsg } });
            }

            await session.sendMessage(buyerId, { text: `Привет, на твой аккаунт было начислено ${sumMsg} msg. ♥` });
        } else if (status === 'VIP') {
            let endDateVIP;

            if (user.infoRoleUsers.status === 'VIP') {
                endDateVIP = new Date(user.infoRoleUsers.endDateVIP);
            } else {
                endDateVIP = new Date();
            }

            endDateVIP.setMonth(endDateVIP.getMonth() + monthsVip);

            await sck1.updateOne(
                { id: buyerId },
                {
                    $set: {
                        'infoRoleUsers.status': 'VIP',
                        'infoRoleUsers.endDateVIP': endDateVIP
                    }
                }
            );

            await session.sendMessage(buyerId, { text: `Статус вашего аккаунта изменен на VIP, до ${endDateVIP}` });
        } else {
            return res.status(400).send('Unsupported status type.');
        }

        await sck1.updateOne({ id: buyerId }, { $inc: { donateSumma: amount } });
        return res.status(200).send('Уведомление обработано успешно.');
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;