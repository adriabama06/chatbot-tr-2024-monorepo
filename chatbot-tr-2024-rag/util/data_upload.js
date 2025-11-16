import pg from "pg";
import pgvector from "pgvector/pg";

import data from "../data.json" with { type: "json" };

import OpenAI from "openai";

const openai_client = new OpenAI({
    baseURL: process.env.EMBEDDING_HOST,
    apiKey: process.env.API_KEY
});

const client = new pg.Client({
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASSWORD,
    database: process.env.POSTGRESQL_DATABASE,
    host: process.env.POSTGRESQL_HOST,
    port: process.env.POSTGRESQL_PORT
});

await client.connect();

await client.query("CREATE EXTENSION IF NOT EXISTS vector");

await pgvector.registerType(client);

var start_time = Date.now();

for (var post_index = 0; post_index < data.posts.length; post_index++) {
    const post = data.posts[post_index];

    const content = post.content.replace(/\W/g, '').trim() == "" ? post.title : post.content; // Use title if there is not content (usually post with only images)

    // Insert the document
    await client.query(
        `INSERT INTO documents (
            id,
            content,
            title,
            post_date,
            article_url
        ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
        )`,
        [
            post.id,
            content,
            post.title,
            post.post_date,
            post.article_url
        ]
    );

    // Split the text every two ". A" (dot + space + uppercaseword/number), to embed it
    const content_splits = content.split(/\. (?=[A-Z0-9])/g);
    
    for(var content_split_index = 0; content_split_index < content_splits.length; content_split_index += 2) {
        if(content_splits.length <= 1) break;

        var content_split = content_splits[content_split_index];

        if(content_splits[content_split_index + 1]) {
            content_split = content_split + ". " + content_splits[content_split_index + 1];
        }

        content_split = content_split.trim();

        const content_split_embedding = await openai_client.embeddings.create({
            model: process.env.EMBEDDING_MODEL,
            input: content_split,
            encoding_format: "float",
            // dimensions: 1024
        });

        const content_split_embedding_data_array = content_split_embedding.data[0].embedding;

        await client.query(
            `INSERT INTO embeddings (
                id,
                embedding
            ) VALUES (
                $1,
                $2
            )`,
            [
                post.id,
                pgvector.toSql(content_split_embedding_data_array)
            ]
        );
    }

    // Also embed the keywords to use it in the search
    for (const keyword of post.keywords) {
        const keyword_embedding = await openai_client.embeddings.create({
            model: process.env.EMBEDDING_MODEL,
            input: keyword,
            encoding_format: "float",
            // dimensions: 1024
        });

        const keyword_embedding_data_array = keyword_embedding.data[0].embedding;

        await client.query(
            `INSERT INTO embeddings (
                id,
                embedding
            ) VALUES (
                $1,
                $2
            )`,
            [
                post.id,
                pgvector.toSql(keyword_embedding_data_array)
            ]
        );
    }

    const elapsed_ms = (Date.now() - start_time);

    const total_time_aprox = data.posts.length / (post_index / elapsed_ms);

    const time = new Date(Math.abs(total_time_aprox - elapsed_ms));

    process.stdout.write(`\r${new Date(elapsed_ms).toGMTString().substring(17, 25)} of ${time.toGMTString().substring(17, 25)} (hour:min:sec) - ${post_index + 1} of ${data.posts.length} - ${post.title.slice(0, 20)}...`);
}

client.end();