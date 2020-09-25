const { ChatClient } = require("dank-twitch-irc");
const chalk = require('chalk');
const config = require("./config.json");
let client = new ChatClient({
    username: config.username,
    password: config.oauth
});

client.connect();
client.joinAll(config.channels);

client.on("ready", () => {
    console.log(chalk.greenBright("Pomyślnie połączono do czatu:") + chalk.blueBright(` ${config.channels[0]}`));
    client.say(config.channels[0], `${config.connect}`);
});

client.on("PRIVMSG", message => {
    if (message.senderUsername == client.configuration.username){
        return;        
    }
    if (message.senderUsername == "demonzzbot"){
        if (message.messageText == "The arena has been cleaned up... Want to go again?! Type !boss to start!"){
            client.say(config.channels[0], "!boss");
            console.log(chalk.yellowBright("Wysłano !boss"));
        }
        if (message.messageText == "The arena is now open! Type !ffa to join!"){
            client.say(config.channels[0], "!ffa");
            console.log(chalk.yellowBright("Wysłano !ffa"));
        }
        if (message.messageText == "The cops have given up! If you want to get a team together type !heist (amount)."){
            client.say(config.channels[0], `!heist ${config.heist}`);
            console.log(chalk.yellowBright(`Wysłano !heist ${config.heist}`));
        }
    }
//demonzzbot events

    if (message.messageText.startsWith(config.prefix)){
        const komenda = message.messageText.slice(config.prefix.length).split(" ")[0];
        switch(komenda){
            case `${config.command}`:
                client.say(message.channelName, `@${message.senderUsername}, Bot działa prawidłowo ;)`);
                break;
        }
    }
//sprawdzanie czy bot dziala
})