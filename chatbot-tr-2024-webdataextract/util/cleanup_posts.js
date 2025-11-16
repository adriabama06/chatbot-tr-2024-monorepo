const POST_TO_REMOVE = [1574, 3875]; // ID of the post to remove from the file
const REMOVE_POST_OLDER_THAN_N_YEARS = 3; // remove the posts that has 3 or more years since the publish date


import { existsSync, readFileSync, writeFileSync } from "fs";

if(!existsSync("util")) {
    console.log("Please run this script in root folder and not in util, ex: node util/script.js");
    process.exit();
}

console.log(`Reading: ${process.argv[2] ?? "./data.json"}`)

var posts_parsed = JSON.parse(
    readFileSync(process.argv[2] ?? "./data.json")
).posts;

var clean_posts = [];

const current_year = new Date().getFullYear();

for(const post of posts_parsed) {
    if(POST_TO_REMOVE.includes(post.id)) continue;
    if((current_year - new Date(post.post_date).getFullYear()) >= REMOVE_POST_OLDER_THAN_N_YEARS) continue;

    clean_posts.push(post);
}

writeFileSync("./data_cleanup.json", JSON.stringify({
    posts: clean_posts
}));
