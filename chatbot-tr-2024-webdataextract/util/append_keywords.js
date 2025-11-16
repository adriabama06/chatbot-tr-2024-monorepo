import { existsSync, readFileSync, writeFileSync } from "fs";

if(!existsSync("util")) {
    console.log("Please run this script in root folder and not in util, ex: node util/script.js");
    process.exit();
}

console.log(`Reading: ${process.argv[2] ?? "./data.json"}`)

var posts_parsed = JSON.parse(
    readFileSync(process.argv[2] ?? "./data.json")
).posts;

const CUSTOM_KEYWORDS = JSON.parse(
    readFileSync("./keywords.json")
);

/**
 * @returns {string[]}
 * @param {string} id
 */
function get_keywords(id) {
    return CUSTOM_KEYWORDS[id] ?? [];
}

for(const post of posts_parsed) {
    const keywords = get_keywords(post.id.toString());

    for(const keyword of keywords) {
        if(!post.keywords.includes(keyword)) post.keywords.push(keyword);
    }
}

writeFileSync("./data_append_keywords.json", JSON.stringify({
    posts: posts_parsed
}));
