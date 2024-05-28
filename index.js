import { ChatClient, AlternateMessageModifier, SlowModeRateLimiter } from '@kararty/dank-twitch-irc';
import chalk from 'chalk';
import editJsonFile from "edit-json-file";
import reload from 'self-reload-json';

const __dirname = new URL('.', import.meta.url).pathname;

var config = new reload(__dirname + '/config.json');

let file = editJsonFile(__dirname + '/config.json', {
    autosave: true
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
	console.log(chalk.greenBright("Pomyślnie połączono do czatu:") + chalk.blueBright(` ${config.channels[0]}`));
    client.say(config.channels[0], `${config.connect}`);
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
            client.say(msg.channelName, "!boss");
        }
        if (msg.messageText.includes("Type !ffa to join!")){
            client.say(msg.channelName, "!ffa");
        }
        if (msg.messageText.includes("-Everyone can Join!- In order to join type !heist (amount).")){
            client.say(msg.channelName, `!heist ${config.heist}`);
        }
        console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.yellowBright(`${msg.senderUsername} `) + chalk.greenBright(`-> ${msg.messageText}`));
    };
// supibot events
    if (msg.senderUsername === config.aliasBotName){
        if (msg.messageText.includes(config.username) && msg.messageText.includes("Rybki gotowe")){
            client.say(msg.channelName, `$$rybki`);
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
                    client.say(msg.channelName, `@${msg.senderUsername}, Bot działa prawidłowo ;)`);
                }, 2000);
                break;
            case "ustaw":
                let heist = parseInt(args[0]);
                if (isNaN(heist)){
                    setTimeout(() => {
                        client.say(msg.channelName, `@${msg.senderUsername}, Podaj poprawną wartość! ${config.prefix}ustaw (liczba do max 10k)`);
                    }, 2000);
                    return;
                } else if(heist > 10000 || heist <= 0){
                    setTimeout(() => {
                        client.say(msg.channelName, `@${msg.senderUsername}, Podaj liczbę od 1 do max 10k!`);
                    }, 2000);
                    return;
                };
                file.set("heist", heist);
                setTimeout(() => {
                    client.say(msg.channelName, `@${msg.senderUsername}, Pomyślnie zmieniono ilość heista na ${heist}!`);    
                }, 2000);
                break;
            case "jakiheist":
                setTimeout(() => {
                    client.say(msg.channelName, `@${msg.senderUsername}, Masz aktualnie ustawione ${config.heist} heista ;)`);    
                }, 2000);
                break;
        }
        console.log(chalk.cyanBright(`#${msg.channelName} `) + chalk.yellowBright(`${msg.senderUsername} -> `) + chalk.greenBright(`${msg.messageText}`));
    }
});

client.on("CLEARCHAT", async (msg) => {
    if (msg.isPermaban() && config.BANDonperma === true){
        client.say(msg.channelName, "BAND");
    }
});

client.connect();
client.joinAll(config.channels);
