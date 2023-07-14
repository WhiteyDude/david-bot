const config = require('config')
const fs = require('fs')
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const rl = readline.createInterface({ input, output });

(async () => {
  let files = await fs.readdirSync(`./${config.get('dataset.source_folder')}`, {withFileTypes: true})
    .filter(item => !item.isDirectory())
    .map(item => item.name)
    .sort()
    .reverse()
    .slice(0,5)
  for (let [x, fileName] of files.entries()) {
    console.log(`${x+1}: ${fileName}`);
  }
  let fileNumber = await rl.question(`Enter the number of the file to parse [1-${files.length}]: `);
  if (!files[fileNumber-1]) {
    console.log("Invalid selection")
    process.exit(0);
  }
  //console.log(`You picked ${files[fileNumber-1]}`)
  let filename = files[fileNumber-1]
  //let filename = "generated-datasets/20230714103449.json"
  try {
    let fileContents = fs.readFileSync(`./${config.get('dataset.source_folder')}${filename}`, 'utf8');
    var dataset = JSON.parse(fileContents);
  } catch (err) {
    console.error(err);
    process.exit(0);
  }

  // Valid JSON
  //
  ///// ------ START CLEANING THE DATASET
  //
  /// Duplicates
  let cleanDataset = dataset.reduce((accumulator, object) => {
    if(objectFound = accumulator.find(arrItem => arrItem.input === object.input && arrItem.output === object.output)) {
        objectFound.times++;
    } else {
        object.times = 1;
        accumulator.push(object);
    }
    return accumulator;
  }, []);
  console.log(`Reduced from ${dataset.length} instructions to ${cleanDataset.length}.`)
  //console.dir(cleanDataset, { depth: null });

  /// Removal of bad entries and fixing of errors
  let replaced = {}
  cleanDataset = cleanDataset.filter((item) => {
    const urlRegexString = "(http|https):\\/\\/[^ \"]+"
    const urlRegex = new RegExp(`^${urlRegexString}$`, "g");
    const userUrlRegex = new RegExp(`^\\(.*\\) ${urlRegexString}$`, "g");
    const userBlankRegex = new RegExp("^\\([^)]*\\)(\\s+)?$")
  
    // Remember we want to uno reverse card these - if we get a match, we return "false" so we _don't_ include it in our filtered output
    // Remove inputs that are only URLs (and the username)
    const inputOnlyUrl = (userUrlRegex.test(item.input.trim())) ? false : true;
    if (!inputOnlyUrl) { replaced['inputOnlyUrl'] |= 0; replaced['inputOnlyUrl'] += 1 }
    // Remove outputs that are only URLs
    const outputOnlyUrl = (urlRegex.test(item.output.trim())) ? false : true;
    if (!outputOnlyUrl) { replaced['outputOnlyUrl'] |= 0; replaced['outputOnlyUrl'] += 1 }
    // Remove inputs that are bank (with the username)
    const inputBlank = (userBlankRegex.test(item.input.trim())) ? false : true;
    if (!inputBlank) { replaced['inputBlank'] |= 0; replaced['inputBlank'] += 1 }
    // Remove outputs that are blank
    const outputBlank = (item.output.trim() === "") ? false : true;
    if (!outputBlank) { replaced['outputBlank'] |= 0; replaced['outputBlank'] += 1 }
    //if (!inputOnlyUrl || !outputOnlyUrl || !inputBlank || !outputBlank) { replacementCount += 1 }
    return inputOnlyUrl && outputOnlyUrl && inputBlank && outputBlank;
  });
  cleanDataset = cleanDataset.map((item) => {
    // Replace any null users with a generic one
    item['input'] = item['input'].replace(/^\(null\)/g, () => { return "(User)"})
    // Delete "times" key created by accumulator
    delete item['times']
    return item
  })
  
  //console.log(replaced)
  let replacementCount = Object.values(replaced).reduce((a, b) => a + b, 0)
  console.log(`Completed ${replacementCount} replacements and removals.`)

   //
  ///// ------ DONE CLEANING, WRITE TO FILE
  //
  console.log(`Final new instruction set size is ${cleanDataset.length} (originally ${dataset.length})`)
  rl.question('Write new data to file (overwriting old if existing)?: [y/n] ')
  .then( (answer) => {
    if (answer.toLowerCase() == "y") {
      let newFileName = filename.replace(/\.json$/, '-parsed.json')
      fs.writeFileSync(`./${config.get('dataset.parsed_folder')}${newFileName}`, JSON.stringify(cleanDataset, null, 2));
      console.log(`Wrote to ./${config.get('dataset.parsed_folder')}${newFileName}`);
    }
    else {
      console.log("Not writing to file, bye!");
    }
    process.exit(0);
  })

  // }
})()
