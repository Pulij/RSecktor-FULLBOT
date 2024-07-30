const loadingReactions = ['⌛', '⏳'];
let animationTimeout;
let animationIsRunning = false;

function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.runAnimation = async (citel) => {
    animationIsRunning = true;
    let i = 0;
    while (animationIsRunning) {
        await citel.react(loadingReactions[i]);
        i = (i + 1) % loadingReactions.length;
        const delay = getRandomDelay(2000, 7000);
        await new Promise(resolve => {
            animationTimeout = setTimeout(resolve, delay);
        });
    }
}

exports.stopAnimation = () => {
    animationIsRunning = false;
    clearTimeout(animationTimeout);
}