const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, index: false },
  chatId: { type: String, index: false },
  name: { type: String, default: "-" },
  gname: { type: String, default: "-" },
  data: {
    msg: {
      dailyMsg: { type: Number, default: 0 },
      allMsg: { type: Number, default: 0 },
      lastMessage: String,
      firstMessage: String,
      firstMessageSentDate: String,
      lastMessageSentDate: String
    },
  }
});

const stat = mongoose.model("stat", UserSchema);
module.exports = { stat };