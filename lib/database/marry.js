const mongoose = require('mongoose');
const MarrySchema = new mongoose.Schema({
id: { type: String, required: true, unique: true },
status: { type: String, default: "alone" },
who: { type: String,  default: "nope" },
marrycreator: { type: String, default: "nope" }
})
// воробей мой пупс
const marrynaxoi =  mongoose.model("Marrynaxoi", MarrySchema)
module.exports = { marrynaxoi }