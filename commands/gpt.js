const { cmd, sendRequestGPT } = require('../lib/index.js');
const axios = require('axios')
const FormData = require('form-data')

cmd({
  pattern: "gpt",
  alias: ["джпт"],
  desc: "YaGPT доступная в РФ нейросеть умеющая генерировать не только текст, но и картинки",
  isVip: true,
  category: "💎 VIP"
}, async ({ Void, citel, text }) => {
  try {
    if (!text) return citel.reply('Что ты от меня хочешь?')
    const commandParts = text.split(" ");
    const action = commandParts[0];
    const prompt = commandParts.slice(1).join(" ");

    switch (action) {
      case "чат":
      case "chat": {
        const res = await sendRequestGPT({ prompt });
        Void.sendMessage(citel.chat, { text: res }, { quoted: citel });
        break;
      }

      case "нарисуй":
      case "male": {
        class Text2ImageAPI {
          constructor(url, apiKey, secretKey) {
            this.URL = url;
            this.AUTH_HEADERS = {
              'X-Key': `Key ${apiKey}`,
              'X-Secret': `Secret ${secretKey}`,
            };
          }

          async getModels() {
            const response = await axios.get(`${this.URL}key/api/v1/models`, { headers: this.AUTH_HEADERS });
            return response.data[0].id;
          }

          async generate(prompt, model, images = 1, width = 1024, height = 1024) {
            const params = {
              type: "GENERATE",
              numImages: images,
              width,
              height,
              generateParams: {
                query: prompt
              }
            };

            const formData = new FormData();
            const modelIdData = { value: model, options: { contentType: null } };
            const paramsData = { value: JSON.stringify(params), options: { contentType: 'application/json' } };
            formData.append('model_id', modelIdData.value, modelIdData.options);
            formData.append('params', paramsData.value, paramsData.options);

            const response = await axios.post(`${this.URL}key/api/v1/text2image/run`, formData, {
              headers: {
                ...formData.getHeaders(),
                ...this.AUTH_HEADERS
              },
              'Content-Type': 'multipart/form-data'
            });
            const data = response.data;
            return data.uuid;
          }

          async checkGeneration(requestId, attempts = 10, delay = 10) {
            while (attempts > 0) {
              try {
                const response = await axios.get(`${this.URL}key/api/v1/text2image/status/${requestId}`, { headers: this.AUTH_HEADERS });
                const data = response.data;
                if (data.status === 'DONE') {
                  return data.images;
                }
              } catch (error) {
                console.error(error);
              }
              attempts--;
              await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
          }
        }

        const api = new Text2ImageAPI('https://api-key.fusionbrain.ai/', '816A92F9215C384478000A0FBE5C3F63', '310FA314F9F76553B19556508F942A5E');
        const modelId = await api.getModels();
        const uuid = await api.generate(prompt, modelId, 1, 1024, 1024, 1);
        const images = await api.checkGeneration(uuid);
        const imageBase64 = Buffer.from(images[0], 'base64');

        await Void.sendMessage(citel.chat, { image: imageBase64 }, { quoted: citel });
        break;
      }
    }
  } catch (e) {
    citel.reply('Произошла ошибка при выполнении запроса, возможно это временно. Если через некоторое время ошибка повторяется -> 79607142717')
  }
});