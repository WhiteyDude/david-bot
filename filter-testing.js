dataset = [
 {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(User1) https://tenor.com/view/he-was-forced-to-eat-gif-21816271",
    "output": "Copy that thanks for the help"
  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(Tim) https://media.discordapp.net/attachments/679671608838848546/1004196956110860409/5B3539AE-D9E9-4008-97AF-70DCF6BF160B.gif",
    "output": "No longer doing just gobbies?",  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(Jimmy) what does a strike even look like",
    "output": "https://tenor.com/view/strike-gif-21181159"
  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(Bob) What is this line?",
    "output": "https://tenor.com/view/snow-white-razor-shoveling-coke-gif-22928183"
  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(User1) ",
    "output": "Right?"
  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(Dominator) ",
    "output": "Absolutely"
  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(James) I hate this so much",
    "output": ""
  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(Tim) I am wet",
    "output": "",
    "times": 2
  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(null) What?",
    "output": "A bundle of discord admins"
  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(null) Ty for the corrections",
    "output": "dont thank them",
    "times": 2
  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(Tom) Jesus fuck",
    "output": "What happened?",
    "times": 2
  },
  {
    "instruction": "You are in a chat room and have decided to reply to this message. The name of the person who sent the message is encapulated in brackets.",
    "input": "(James) i had this server muted for a bit and fuckin christ i come back to emoji spam",
    "output": "You should scroll up further"
  }
]

// Two "input only URL" entries ✅
// Two "output only URL" entries ✅
// Two "blank input" entries ✅
// Two "blank output" entries ✅
// Two "null user" entries ✅
// Remove "times" key added by earlier reduce
// Two "valid" entries ✅

cleanDataset = dataset.filter((item) => {
  const urlRegexString = "(http|https):\\/\\/[^ \"]+"
  const urlRegex = new RegExp(`^${urlRegexString}$`, "g");
  const userUrlRegex = new RegExp(`^\\(.*\\) ${urlRegexString}$`, "g");
  const userBlankRegex = new RegExp("^\\([^)]*\\)(\\s+)?$")

  // Remember we want to uno reverse card these - if we get a match, we return "false" so we _don't_ include it in our filtered output
  const inputOnlyUrl = (userUrlRegex.test(item.input.trim())) ? false : true;
  const outputOnlyUrl = (urlRegex.test(item.output.trim())) ? false : true;
  const inputBlank = (userBlankRegex.test(item.input.trim())) ? false : true;
  const outputBlank = (item.output.trim() === "") ? false : true;
  return inputOnlyUrl && outputOnlyUrl && inputBlank && outputBlank;
});
cleanDataset = cleanDataset.map((item) => {
  item['input'] = item['input'].replace(/^\(null\)/g, () => { return "(User)"})
  delete item['times']
  return item
})
console.log(cleanDataset)