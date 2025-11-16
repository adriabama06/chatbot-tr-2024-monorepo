import { generate_keywords } from "../keywords.js";

import { existsSync, readFileSync, writeFileSync } from "fs";

if(!existsSync("util")) {
    console.log("Please run this script in root folder and not in util, ex: node util/script.js");
    process.exit();
}

console.log(`Reading: ${process.argv[2] ?? "./data.json"}`)

var posts_parsed = JSON.parse(
    readFileSync(process.argv[2] ?? "./data.json")
).posts;

console.log("Generating keywords...");

var time_start = Date.now();
var last_time = Date.now();

for(var i = 0; i < posts_parsed.length; i++) {
    var post = posts_parsed[i];

    console.log(`${i + 1}/${posts_parsed.length} - Generating keywords - ${post.title.slice(0, 20)}...`);

    post.keywords = await generate_keywords(post.id, post.title, post.content);

    posts_parsed[i] = post;

    const elapsed_ms = (Date.now() - time_start);

    console.log(`Time took ${new Date(Date.now() - last_time).toGMTString().substring(20, 25)} (min:sec)`);

    last_time = Date.now();



    const total_time_aprox = posts_parsed.length / (i / elapsed_ms);

    const time = new Date(Math.abs(total_time_aprox - elapsed_ms));

    console.log(`${new Date(elapsed_ms).toGMTString().substring(17, 25)} elapsed of expect remain ${time.toGMTString().substring(17, 25)} (hour:min:sec)`);
}

writeFileSync("./data_keywords.json", JSON.stringify({
    posts: posts_parsed
}));
