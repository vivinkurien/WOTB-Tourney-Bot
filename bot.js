const Discord = require("discord.js");
const client = new Discord.Client();
var BOT_TOKEN = process.env.BOT_TOKEN; 


client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log('Bot has started'); 
  });


client.on("message", async message => {
   
 console.log(message.content);
  
});

client.login(process.env.BOT_TOKEN)
  .then(console.log('logged in'))
.catch(console.error);
