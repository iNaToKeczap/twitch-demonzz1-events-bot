import { ChatClient, AlternateMessageModifier, SlowModeRateLimiter } from '@kararty/dank-twitch-irc';
import chalk from 'chalk';
import editJsonFile from "edit-json-file";
import reload from 'self-reload-json';

// load config.json file
const __dirname = new URL('.', import.meta.url).pathname;
var config = new reload(__dirname + '/config.json');
let file = editJsonFile(__dirname + '/config.json', {
    autosave: true
});

// merge channels to join
const channels = config.channels
if(config.enabledFishing && !config.channels.includes(config.fishingBotChannel)) {
    channels.push(config.fishingBotChannel)
}
// create banned channels map
const bannedChannelsMap = new Map();
channels.forEach(channel => {
    bannedChannelsMap.set(channel, false);
});

// declare client
let client = new ChatClient({
    username: config.username,
    password: `oauth:${config.oauth}`,
    connection: {
        type: "websocket",
        secure: true,
    },
});

// events on client
client.use(new AlternateMessageModifier(client));
client.use(new SlowModeRateLimiter(client, 10));

client.on("ready", async () => {
	console.log(chalk.greenBright("Pomyślnie połączono do czatu:") + chalk.blueBright(` ${channels.join(', ')}`));
//run fishing command on join to channel
    if (config.enabledFishing) {
        setTimeout(() => {
            say(config.fishingBotChannel, `$alias try wojcieszekb rybki`);
        }, 1500);
    }
});

client.on("close", async (error) => {
    if (error !== null){
        console.error(`Client closed due to error`, error);
    }
});

client.on("PRIVMSG", async (msg) => {
//demonzzbot events
    if (msg.senderUsername === config.bossBotName){
        if (msg.messageText.includes("Type !boss to join!")){
            say(msg.channelName, "!boss");
        }
        if (msg.messageText.includes("Type !ffa to join!")){
            say(msg.channelName, "!ffa");
        }
        if (msg.messageText.includes("-Everyone can Join!- In order to join type !heist (amount).")){
            say(msg.channelName, `!heist ${config.heist}`);
        }
        console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.yellowBright(`${msg.senderUsername} `) + chalk.greenBright(`-> ${msg.messageText}`));
    };
//supibot events
    if (msg.senderUsername === config.fishingBotName && msg.channelName === config.fishingBotChannel){
        if (msg.messageText.includes(config.username) && msg.messageText.includes("Rybki gotowe") && config.enabledFishing){
            say(msg.channelName, `$alias try wojcieszekb rybki`);
        }
        console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.yellowBright(`${msg.senderUsername} `) + chalk.greenBright(`-> ${msg.messageText}`));
    };
//commands
    if (msg.messageText.startsWith(config.prefix) && msg.senderUsername === config.username){
        const args = msg.messageText.slice(config.prefix.length).trim().split(/\s+/);
        const command = args.shift().toLowerCase();
        switch(command){
            case `${config.command}`:
                setTimeout(() => {
                    say(msg.channelName, `@${msg.senderUsername}, Bot działa prawidłowo ;)`);
                }, 1500);
                break;
            case "ustaw":
                let heist = parseInt(args[0]);
                if (isNaN(heist)){
                    setTimeout(() => {
                        say(msg.channelName, `@${msg.senderUsername}, Podaj poprawną wartość! ${config.prefix}ustaw (liczba do max 10k)`);
                    }, 1500);
                    return;
                } else if(heist > 10000 || heist <= 0){
                    setTimeout(() => {
                        say(msg.channelName, `@${msg.senderUsername}, Podaj liczbę od 1 do max 10k!`);
                    }, 1500);
                    return;
                };
                file.set("heist", heist);
                setTimeout(() => {
                    say(msg.channelName, `@${msg.senderUsername}, Pomyślnie zmieniono ilość heista na ${heist}!`);    
                }, 1500);
                break;
            case "jakiheist":
                setTimeout(() => {
                    say(msg.channelName, `@${msg.senderUsername}, Masz aktualnie ustawione ${config.heist} heista ;)`);    
                }, 1500);
                break;
        }
        console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.yellowBright(`${msg.senderUsername} -> `) + chalk.greenBright(`${msg.messageText}`));
    }
});

client.on("CLEARCHAT", async (msg) => {
    if (msg.targetUsername === config.username) {
        if (msg.isPermaban()){
            client.part(msg.channelName);
            banOnChannel(msg.channelName);
            console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.yellowBright(`${config.username} -> `) + chalk.greenBright(`Masz bana na kanale ${msg.channelName}! Rozłączanie...`));
        } else if (msg.isTimeout()) {
            console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.yellowBright(`${config.username} -> `) + chalk.greenBright(`Masz bana na kanale ${msg.channelName} na ${msg.banDuration} sekund!`));
            banOnChannel(msg.channelName);
            setTimeout(() => {
                unbanOnChannel(msg.channelName);
                console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.yellowBright(`${config.username} -> `) + chalk.greenBright(`Bot is resuming!`));
            }, msg.banDuration * 1000);
        }
    } else if (config.onBanned === true){
        if (msg.isPermaban()){
            say(msg.channelName, `PERMA BAND @${msg.targetUsername}`);
        } else if (msg.isTimeout()) {
            say(msg.channelName, `BAND @${msg.targetUsername} na ${msg.banDuration} sekund`);
        }
    }
});

client.on("ROOMSTATE", async (msg) => {
    if(msg.emoteOnly) {
        console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.greenBright(`Emote only czat włączony!`));
    } else if(msg.emoteOnly) {
        console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.greenBright(`Emote only czat wyłączony!`));
    }
    if(msg.subscribersOnly) {
        console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.greenBright(`Sub only czat włączony!`));
    } else if(!msg.subscribersOnly) {
        console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.greenBright(`Sub only czat wyłączony!`));
    }
 });

client.connect();
client.joinAll(channels);

function bannedOnChannel(channel) {
    return bannedChannelsMap.get(channel);
}

function banOnChannel(channel) {
    bannedChannelsMap.set(channel, true);
}

function unbanOnChannel(channel) {
    bannedChannelsMap.set(channel, false);
}

function say(channel, message) {
    if(!bannedOnChannel(channel)) {
        client.say(channel, message);
    } else {
        console.log(`Masz wciąż bana na kanale ${channel}!`)
    }
}