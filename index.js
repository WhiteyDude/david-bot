const { Client } = require('discord.js-selfbot-v13');
const discord = new Client({
  checkUpdate: false
	// See other options here
	// https://discordjs-self-v13.netlify.app/#/docs/docs/main/typedef/ClientOptions
	// All partials are loaded automatically
});
const config = require('config')

discord.on('ready', async () => {
  console.log(`${discord.user.username} is ready!`);
  await fetchAllMessages();
})


async function fetchAllMessages() {
  //const channel = discord.channels.cache.get(testChannel);
  let davidMessages = [];
  let dataset = [];
  //console.dir(channel, { depth: null });

  discord.guilds.cache.get(guildId).channels.cache.forEach(async (channel) => {
    if (channel.type === 'GUILD_TEXT'){
      console.log(`Looping through ${channel.name}`)
      // Create message pointer
      let message = await channel.messages
        .fetch({ limit: 1 })
        .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

      while (message) {
        await channel.messages
          .fetch({ limit: 100, before: message.id })
          .then(async (messagePage) => {
            messagePage.forEach(async (msg) => {
              // messages[messageId] = {
              //   'timestamp': msg.createdTimestamp,
              //   'messageId': msg.id,
              //   'userId': msg.author.id,
              //   'userName': msg.author.globalName,
              //   'content': msg.content,
              //   'isReply': (msg.type == 'REPLY') ? true : false,
              //   'replyMessageId': (msg.reference) ? msg.reference.messageId : ''
              // };
              if (msg.author.id == davidId && msg.type == 'REPLY') {
                //console.log(`Found a match (${msg.author.id} == ${davidId} and it's a ${msg.type})`)
                let replyMessage = await channel.messages.fetch(msg.reference.messageId)
                davidMessages.push({
                  'timestamp': msg.createdTimestamp,
                  'messageId': msg.id,
                  'content': msg.content,
                  'replyMessage': {
                    'messageId': replyMessage.id,
                    'content': replyMessage.content,
                    'userName': replyMessage.author.globalName                
                  }
                })  
              }
            });

            // Update our message pointer to be the last message on the page of messages
            message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;

          })
        if (message) {
          console.log(`Found ${davidMessages.length} matches...`)
          let seconds = Math.floor(Math.random() * (7500 - 3700) + 3500);
          console.log(`Waiting ${Math.floor(seconds/1000)} seconds before continuing...`)
          await new Promise(resolve => setTimeout(resolve, seconds));
        }
      }
    }
  });

  //console.log(davidMessages);  // Print all messages
  if (davidMessages.length < 1) {
    console.log("No messages found :(")
    return
  }
  davidMessages.forEach(function(msg) { 
    // console.log(`You are David, an AI chatbot designed to copy the mannerisms of David. Your spelling and punctuation aren\'t the best and you regularly make gramatical errors (e.g. confusing their and they\'re, your and you\'re, etc). You also often break up your messages into multiple lines, even when speaking in a single sentence.

    // As David, you will receive messages from many people. 
    // `)
    // console.log(`${msg.replyMessage.userName}: ${msg.replyMessage.content}`);
    // console.log(`David: ${msg.content}`);
    dataset.push({
      "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
      "input": `(${msg.replyMessage.userName}) ${msg.replyMessage.content}`,
      "output": msg.content
    })
  })
  console.log(dataset);
}

// main
async function main() {
    discord.login(discordToken);
}

main()