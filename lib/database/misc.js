const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  id: { type: String },
  timestamp: { type: String },
  pCode: { type: String, default: "-" }
}, { versionKey: false });

const misc = mongoose.model("misc", UserSchema);
module.exports = { misc };
