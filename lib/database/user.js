const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, default: "-" },
    orientation: { type: String, default: "-" },
    level: { type: Number, default: 1 },
    msg: { type: Number, default: 0 },
    allMsg: { type: Number, default: 0 },
    visibleValute: { type: Boolean, default: true },
    donateSumma: { type: Number, default: 0 },
    bank: {
        card: { type: Boolean, default: false },
        sumMsgBank: { type: Number, default: 0 },
        cell: { type: Number, default: 1 }
    },
    infoRoleUsers: {
        status: { type: String, default: 'free' },
        endDateVIP: { type: String, default: '-' },
        use_trial: { type: Boolean, default: false }
    },
    dateBan: {
        ban: { type: Boolean, default: false },
        typeBan: { type: String, default: "-" },
        dateBan: { type: String, default: "-" },
        dateUnban: { type: String, default: "-" },
        reasonBan: { type: String, default: "-" },
        countBan: { type: Number, default: 0 }
    },
    lastSendMsg: { type: String, default: new Date() },
    dateRegisterAccount: { type: String, default: new Date() }
});

const sck1 = mongoose.model("user", UserSchema);


module.exports = { sck1 };