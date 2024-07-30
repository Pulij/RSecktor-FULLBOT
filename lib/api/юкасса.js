const axios = require("axios");
const { v4: uuidv4 } = require('uuid');

async function createPayment({ status = 'undefined', value = 0, monthsVip = 0, description = 'Donate WhaBot 1', buyer = 'Undefined User', sumMsg = 0 }) {
  const shopId = '250293';
  const secretKey = 'live_1XUEomqmngbA8xveGoMkMDiCUx0j9pJTSj7jDg53v9I';
  const idempotenceKey = uuidv4();
  const headers = {
    'Idempotence-Key': idempotenceKey,
    'Authorization': `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
    'Content-Type': 'application/json',
  };

  return axios.post(
    'https://api.yookassa.ru/v3/payments',
    {
      "amount": {
        "value": value,
        "currency": "RUB"
      },
      "capture": true,
      "confirmation": {
        "type": "redirect",
        "return_url": `https://api.whatsapp.com/send/?Thank You for Payment)`
      },
      "description": `${description} (ID - ${buyer})`,
      "metadata": {
        "buyer": buyer,
        "sumMsg": sumMsg,
        "status": status,
        "monthsVip": monthsVip
      },
      //чек
      "receipt": {
        "items": [
          {
            "description": `${description} (ID - ${buyer})`,
            "quantity": 1,
            "amount": {
              "value": value,
              "currency": "RUB"
            },
            "vat_code": 2
          }
        ],
        "customer": {
          "email": 'whabot.help@gmail.com'
        }
      }
    },
    { headers }
  );
}

module.exports = { createPayment }