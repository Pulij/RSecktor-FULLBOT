const mongoose = require('mongoose');
const PrivateSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    role: { type: String, default: "-" },
    botenable: { type: Boolean, default: true }
})
const sck0 = mongoose.model("private", PrivateSchema)
module.exports = { sck0 }