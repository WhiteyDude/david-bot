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
      let message
      try {
        message = await channel.messages
        .fetch({ limit: 1 })
        .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));
      }
      catch (err) {
        // Probably DiscordAPIError: Missing Access
        console.error(error)
        continue;
      }

      let loopCount = 0
      let messages = []

      while (message) {
        //if (loopCount > 5000) { break } // Dev
        await channel.messages
          .fetch({ limit: 50, before: message.id })
          .then(async (messagePage) => {
            loopCount += messagePage.size
            for (let [id, msg] of messagePage) {
              //console.log(id)
              //messagePage.forEach(async (msg) => {
              messages.push({
                'timestamp': msg.createdTimestamp,
                'messageId': msg.id,
                'userId': msg.author.id,
                'userName': msg.author.globalName,
                'content': msg.content,
                'isReply': (msg.type == 'REPLY') ? true : false,
                'replyMessageId': (msg.reference) ? msg.reference.messageId : ''
              });
              //
              //console.log(`${msg.author.globalName}: ${discordMessageParse(msg.content)}`)
              if (msg.author.id == config.get('discord.davidId') && msg.type == 'REPLY') {
                //console.log(`Found a match (${msg.author.id} == ${davidId} and it's a ${msg.type})`)
                let replyMessage = await channel.messages.fetch(msg.reference.messageId)
                let davidStreak = true
                let davidStreakOffset = 2
                while (davidStreak) {
                  // Check if the last message was from David too - if so, append it
                  if ((messages.length - davidStreakOffset) > -1) {
                    let tmpMessage = messages[messages.length-davidStreakOffset]
                    if (tmpMessage.userId == config.get('discord.davidId')) {
                      // console.log(`Match! ${msg.id} / ${tmpMessage.messageId}`);
                      // console.log(`David: ${msg.content}`)
                      // console.log(`Temp message (offset: ${messages.length} - ${davidStreakOffset}):`)
                      // console.log(`${tmpMessage.userName}: ${tmpMessage.content}`)
                      // console.log(" ")
                      //davidMessages[davidMessages.length-1].content += discordMessageParse(tmpMessage.content)
                      msg.content += `\n${discordMessageParse(tmpMessage.content)}`
                      davidStreakOffset += 1
                    }
                    else {
                      // console.log("No match:")
                      // console.log(`David: ${msg.content}`)
                      // console.log(`${tmpMessage.userName}: ${discordMessageParse(tmpMessage.content)}`)
                      // console.log(" ")
                      davidStreak = false
                    }
                  }
                }
                //console.log(`Reply: ${msg.id}`)
                davidMessages.push({
                  'timestamp': msg.createdTimestamp,
                  'messageId': msg.id,
                  'content': discordMessageParse(msg.content),
                  'replyMessage': {
                    'messageId': replyMessage.id,
                    'content': discordMessageParse(replyMessage.content),
                    'userName': replyMessage.author.globalName                
                  }
                })
              }
              //console.log("End of async message page (per message loop)")
            };

            // Update our message pointer to be the last message on the page of messages
            message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
            // End of page
          })
        if (message) {
          console.log(`Found ${davidMessages.length} matches in ${loopCount} messages...`)
          // let seconds = Math.floor(Math.random() * (7500 - 3700) + 3500);
          let seconds = Math.floor(Math.random() * (3700 - 1200) + 1200);
          console.log(`Waiting ${(seconds/1000).toFixed(2)} seconds before continuing...`)
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
  }
  //console.log(dataset);
  try {
    let d = new Date()
    let filename = `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2, '0')}${d.getDate()}${d.getHours().toString().padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}${d.getSeconds().toString().padStart(2, '0')}`
    fs.writeFileSync(`./generated-datasets/${filename}.json`, JSON.stringify(dataset, null, 2));
    console.log(`Wrote dataset to ./generated-datasets/${filename}.json`)
  } catch (err) {
    console.error(err);
  }
}

function discordMessageParse(content) {
  content = content.replace(/<@!?\d+>/g, ""); // Strip mentions
  content = content.replace(/\s\s/g, " "); // Remove double spaces
  //content = content.replace(/\|\|/g, ""); // Replace spoiler tags
  return content;
}

// main
async function main() {
    discord.login(config.get('discord.token'));
}

main()