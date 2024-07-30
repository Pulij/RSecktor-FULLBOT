const mongoose = require('mongoose');
const GroupSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    events: { type: Boolean, default: false },
    nsfw: { type: Boolean, default: true },
    welcome: { type: String, default: "Привет @user, добро пожаловать в @gname" },
    goodbye: { type: String, default: "@user НН Ливнул" },
    role: { type: String, default: "-" },
    botenable: { type: Boolean, default: true },
    antilink: { type: Boolean, default: false },
    removeAdminSwitch: { type: Boolean, default: false }
})
const sck = mongoose.model("group", GroupSchema)
module.exports = { sck }