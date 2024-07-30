const { sck1 } = require('../database/user');

exports.unbanAccount = async () => {
    await sck1.updateOne(
        { id: citel.sender },
        {
            $set: {
                'dateBan.ban': false,
                'dateBan.dateUnban': '-',
                'dateBan.reasonBan': '-',
                'dateBan.dateBan': '-',
                'dateBan.typeBan': '-'
            }
        }
    );
}

exports.banAccount = async ({ jid, msg, reason, dateUnban, typeBan }) => {
    await sck1.updateOne(
        { id: jid },
        {
            $set: {
                msg: msg,
                'dateBan.ban': true,
                'dateBan.reasonBan': reason,
                'dateBan.dateBan': new Date(),
                'dateBan.dateUnban': dateUnban,
                'dateBan.typeBan': typeBan
            },
            $inc: {
                'dateBan.countBan': 1
            }
        }
    );
}