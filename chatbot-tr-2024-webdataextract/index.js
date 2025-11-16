import fs from "fs";

import { get_posts, get_pages } from "./api.js";
import { parse_post_data, correct_words } from "./html.js";
import { html_to_markdown } from "./html_to_markdown.js";

/**
 * @type {Array<{
 * id: number,
 * title: string,
 * content: string,
 * article_url: string,
 * post_date: string,
 * keywords: string[]
 * }>}
 */
var posts_parsed = [];

console.log("Downloading pages:");

for(var i = 0; true; i++) {
    const posts = await get_pages(i + 1);

    if(posts?.data?.status == 400) {
        break;
    }

    console.log(`${i + 1} - ${correct_words(posts[0].title.rendered).slice(0, 20)}...`);

    for(const post of posts) {
        if(post?.content?.rendered) {
            const content = await html_to_markdown(post.content.rendered, "turndown");

            if(content.length == 0) continue;

            posts_parsed.push({
                id: post.id,
                title: correct_words(post.title.rendered),
                content: content,
                article_url: post.link,
                post_date: post.date,
                keywords: null
            });
        }
    }
}

console.log("Downloading posts:");

for(var i = 0; true; i++) {
    const posts = await get_posts(i + 1);

    if(posts?.data?.status == 400) {
        break;
    }

    console.log(`${i + 1} - ${correct_words(posts[0].title.rendered).slice(0, 20)}...`);

    for(const post of posts) {
        if(post?.content?.rendered) {
            const content = await html_to_markdown(post.content.rendered, "turndown");

            if(content.length == 0) continue;

            posts_parsed.push({
                id: post.id,
                title: correct_words(post.title.rendered),
                content: content,
                article_url: post.link,
                post_date: post.date,
                keywords: null
            });
        }
    }
}

fs.writeFileSync("data.json", JSON.stringify({
    posts: posts_parsed
}));