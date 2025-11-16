import { existsSync, readFileSync, writeFileSync } from "fs";

if(!existsSync("util")) {
    console.log("Please run this script in root folder and not in util, ex: node util/script.js");
    process.exit();
}

console.log(`Reading: ${process.argv[2] ?? "./data.json"}`)

var posts_parsed = JSON.parse(
    readFileSync(process.argv[2] ?? "./data.json")
).posts;

for(const post of posts_parsed) {
    for(const keyword of post.keywords) {
        const keyword_lowercase = keyword.toLowerCase();

        const posts_has_keyword = posts_parsed.filter(p =>
            p.id != post.id
            && p.keywords.find(k =>
                k.toLowerCase() == keyword_lowercase
            )
        );

        for(const post_has_keyword of posts_has_keyword) {
            post_has_keyword.keywords = post_has_keyword.keywords.filter(k =>
                k.toLowerCase() != keyword_lowercase
            );
        }
    }
}

writeFileSync("./data_remove_repeated_keywords.json", JSON.stringify({
    posts: posts_parsed
}));
