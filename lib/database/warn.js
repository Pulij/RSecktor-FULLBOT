const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
    warnedId: { type: String, required: true },
    groupId: String,
    dateWarn: [{
        id: String,
        date: String,
        reason: String,
        count: { type: Number, default: 0 }
    }],
    count: { type: Number, default: 0 }
});

const warndb = mongoose.model("warndb", BlockSchema);
module.exports = { warndb };