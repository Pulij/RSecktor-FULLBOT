var commands = [];

function cmd(info, func) {
    var data = info;
    data.function = func;
    data.work = __dirname
    commands.push(data);
    return data;
}

module.exports = {
    cmd,
    AddCommand: cmd,
    Function: cmd,
    Module: cmd,
    commands,
};