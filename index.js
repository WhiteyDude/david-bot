const { Client } = require('discord.js-selfbot-v13');
const discord = new Client({
  checkUpdate: false
	// See other options here
	// https://discordjs-self-v13.netlify.app/#/docs/docs/main/typedef/ClientOptions
	// All partials are loaded automatically
});
const config = require('config')
const fs = require('fs')

discord.on('ready', async () => {
  console.log(`${discord.user.username} is ready!`);
  await fetchAllMessages();
})


async function fetchAllMessages() {
  //const channel = discord.channels.cache.get(testChannel);
  let davidMessages = [];
  let dataset = [];
  //console.dir(channel, { depth: null });
  const guild = discord.guilds.cache.get(config.get('discord.guildId'));

  for (let ch of guild.channels.cache) {
    // ch[0] is the channel id, ch[1] is the object
    let channel = ch[1]
    if (channel.type === 'GUILD_TEXT'){
      if (!channel.permissionsFor(discord.user.id).has(['READ_MESSAGE_HISTORY'])) {
        //console.log(`I don't have permission to read ${channel.name}`)
        continue;
      }
      if (config.get('discord.excludedChannelIds').includes(channel.id)) {
        //console.log(`${channel.name} is on my exclusion list`)
        continue;
      }
      if (config.get('discord.includedChannelIds').length > 0) {
        if (!config.get('discord.includedChannelIds').includes(channel.id)) {
          //console.log(`We're on included channel IDs only, and ${channel.name} isn't one of them`)
          continue;
        }
      }
      console.log(`----- Getting messages for ${channel.name}...`)
      // Create message pointer
      let message = await channel.messages
      .fetch({ limit: 1 })
      .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

      let loopCount = 0

      while (message) {
        await channel.messages
          .fetch({ limit: 100, before: message.id })
          .then(async (messagePage) => {
            loopCount += messagePage.size
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
              if (msg.author.id == config.get('discord.davidId') && msg.type == 'REPLY') {
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
          console.log(`Found ${davidMessages.length} matches in ${loopCount} messages...`)
          let seconds = Math.floor(Math.random() * (7500 - 3700) + 3500);
          console.log(`Waiting ${Math.floor(seconds/1000)} seconds before continuing...`)
          await new Promise(resolve => setTimeout(resolve, seconds));
        }
        else {
          loopCount = 0
        }
      }
    }
  };

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
  //console.log(dataset);
  try {
    let d = new Date()
    let filename = `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2, '0')}${d.getDate()}${d.getHours().toString().padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}${d.getSeconds().toString().padStart(2, '0')}`
    fs.writeFileSync(`./generated-datasets/${filename}.json`, dataset);
    console(`Wrote dataset to ./generated-datasets/${filename}.json`)
  } catch (err) {
    console.error(err);
  }
}

// main
async function main() {
    discord.login(config.get('discord.token'));
}

main()