import { generate_keywords_batch } from "../keywords.js";

import { existsSync, readFileSync, writeFileSync } from "fs";

if(!existsSync("util")) {
    console.log("Please run this script in root folder and not in util, ex: node util/script.js");
    process.exit();
}

console.log(`Reading: ${process.argv[2] ?? "./data.json"}`)

var posts_parsed = JSON.parse(
    readFileSync(process.argv[2] ?? "./data.json")
).posts.slice(0,15);

console.log("Generating keywords...");

var time_start = Date.now();

// Call batch function
const keywords_batch = await generate_keywords_batch(posts_parsed);
for (let i = 0; i < posts_parsed.length; i++) {
    posts_parsed[i].keywords = keywords_batch[i];
}

const elapsed_ms = (Date.now() - time_start);
console.log(`Batch completed in ${new Date(elapsed_ms).toGMTString().substring(17, 25)} (hour:min:sec)`);

writeFileSync("./data_keywords.json", JSON.stringify({
    posts: posts_parsed
}));
