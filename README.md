# Exfiltrating data from Discord using user script

Designed to grab data paletable to Alapca based LLM training - instruction/input/output

### Setup

Create `config/default.json`. Sample:

```
{
  "discord": {
    "guildId": "111111111111111111",
    "davidId": "222222222222222222",
    "token": "MyFuNkYDiscOrdTokeN",
    "excludedChannelIds": [
      "111111111111111333"
    ],
    "includedChannelIds": []
  },
  "dataset": {
    "source_folder": "generated-datasets/source/",
    "parsed_folder": "generated-datasets/parsed/"
  }
}
```

The `davidId` is the person you want to gather data on.

You should be able to ascertain how to get the `token` by using your favourite search engine (kagi, DDG, etc).

If `excludedChannelIds` has values, those channel IDs are skipped.

If `includedChannelIds`, _only_ those channels are slurped.

### Elements

`extract.js`
This connects to Discord as a self-bot and loops based on the conditions you've set in `default.json` through a server in all channels looking for replies from `davidId`. It then dumps the output into your generated dataset source folder (specified in `default.json`).

If it crashes, you have to start again. Sorry!

`post-parse-dataset.js`
This parses our newly created source dataset and spits out a cleaner file - see [Conditionals](#conditionals) for what it does.

### Known bugs/things to know

- Test runs have shown it to run on the same channel twice sometimes? The post parsing script removes duplicates anyway, not sure why.
- It errors trying to read channels it doesn't have permissions to (I probably should improve initial checks for this), but they're caught, displayed and ignored (any errors during message read are, so maybe keep an eye on it).
- It uses random intervals to scrape 50 messages at a time, which probably makes it less obvious to discord's audit systems, but buyer beware. Could probably be improved, I _assume_ `discord.js-selfbot-v13` does some stuff to help with this too.

### Conditionals
 
It creates instructions if:
1. The message is from `davidId`
2. The message is a reply (the original message content is the `input`)
3. The message was sent after November 11th 2020 (when Discord implemented replies)

Post processing removes messages that:
- The input (the original message replied to) is just a URL
- The input is blank
- The output is just a URL
- The output is blank

We also strip mentions and double spaces.