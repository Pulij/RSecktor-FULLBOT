//==============Функции=================
const functions = {
    getAdmin: async (Void, citel) => {
        var adminn = await Void.groupMetadata(citel.chat);
        a = [];
        for (let i of adminn.participants) {
            if (i.admin == null) continue;
            a.push(i.id);
        }
        return a;
    }
};
//======================Все функции SamPandey=============
const {
    generateMessageTag,
    processTime,
    getBuffer,
    fetchJson,
    runtime,
    clockString,
    sleep,
    isUrl,
    getTime,
    formatDate,
    formatp,
    jsonformat,
    logic,
    generateProfilePicture,
    bytesToSize,
    getSizeMedia,
    parseMention,
    GIFBufferToVideoBuffer,
    sendRequestGPT,
    smsg,
    randomDelay,
    getSessionList,
    removeFolder
} = require('./myfuncn.js')

const {
    banAccount,
    unbanAccount
} = require('./moderFunction/accounts.js')

const {
    checkNextLevel,
    calcMessagesPerLevel,
    updateMessageCounter,
    calcLevelUpPrice,
    updateLevel,
} = require('./economyFunction/timeFunc.js')

const { runAnimation, stopAnimation } = require('./anim.js')
//===================== DataBase Const + CMD + Replics ===========
const { sck } = require(__dirname + '/database/group')
const { sck1 } = require(__dirname + '/database/user')
const { sck0 } = require(__dirname + '/database/private')
const { misc } = require(__dirname + '/database/misc')
const { marrynaxoi } = require(__dirname + '/database/marry')
const { warndb } = require(__dirname + '/database/warn')
const { cmd, commands } = require(__dirname + '/cmd')
const { stat } = require(__dirname + '/database/statistick')
//=================================================================

//======================Export
module.exports = {
    cmd,
    commands,
    ...functions,
    sck,
    sck1,
    sck0,
    stat,
    misc,
    warndb,
    marrynaxoi,
    generateMessageTag,
    getSessionList,
    stopAnimation,
    calcMessagesPerLevel,
    checkNextLevel,
    banAccount,
    unbanAccount,
    processTime,
    getBuffer,
    calcLevelUpPrice,
    fetchJson,
    removeFolder,
    runAnimation,
    sendRequestGPT,
    runtime,
    clockString,
    sleep,
    isUrl,
    updateLevel,
    randomDelay,
    getTime,
    formatDate,
    formatp,
    jsonformat,
    logic,
    generateProfilePicture,
    bytesToSize,
    getSizeMedia,
    parseMention,
    GIFBufferToVideoBuffer,
    updateMessageCounter,
    smsg,
    isInstaUrl: (url) => {
        /(?:(?:http|https):\/\/)?(?:www.)?(?:instagram.com|instagr.am|instagr.com)\/(\w+)/gim.test(
            url
        );
    }
}; 