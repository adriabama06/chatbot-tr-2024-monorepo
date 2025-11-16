import pg from "pg";
import pgvector from "pgvector/pg";

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

const prompt = process.argv[2] ? process.argv.slice(2).join(" ") : "Com puc inscriure al meu fill?";

console.log(`Prompt: ${prompt}`);

const query = await openai_client.embeddings.create({
    model: process.env.EMBEDDING_MODEL,
    input: prompt,
    encoding_format: "float",
    // dimensions: 1024
});

const query_data_array = query.data[0].embedding;

const results = await client.query(
    `WITH top_n_relevant AS (
        SELECT
            id,
            1 - (embedding <=> $1) AS similarity_score
        FROM embeddings
        WHERE 1 - (embedding <=> $1) > 0.6
        ORDER BY embedding <=> $1
        LIMIT ($2*2) -- Multiply *2 because may be by the usage of keywords can be repeated on the same ID and to no only get one ID expand the limit and by probability I will get more ID's
    ),
    top_n_relevant_not_repeat AS (
        SELECT id, MAX(similarity_score) AS similarity_score
        FROM top_n_relevant
        GROUP BY id
    )
    SELECT
        docs.id,
        docs.content,
        docs.title,
        docs.post_date,
        docs.article_url,
        relevant.similarity_score
    FROM top_n_relevant_not_repeat relevant
    JOIN documents docs ON docs.id = relevant.id
    -- ORDER BY post_date DESC
    LIMIT $2;`,
    [
        pgvector.toSql(query_data_array),
        5
    ]
);

results.rows.forEach((res, i) => {
    console.log(`${i + 1} - Sim: ${res.similarity_score} - ID: [${res.id}] DATE: [${res.post_date.toISOString()}] -> ${res.content}\n`);
});

client.end();