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

/**
 * @typedef {{
 * id: number,
 * content: string,
 * title: string,
 * post_date: Date,
 * article_url: string,
 * similarity_score: number
 * }} RelevantDocument
 */

/**
 * @returns {Promise<RelevantDocument[]>}
 * @param {string} query 
 * @param {number?} n_results 
 */
export async function pgvector_query(query, n_results = 5) {
    const query_embedding = await openai_client.embeddings.create({
        model: process.env.EMBEDDING_MODEL,
        input: query,
        encoding_format: "float",
        // dimensions: 1024
    });

    const query_embedding_data = query_embedding.data[0].embedding;

    if(!query_embedding_data) return [];

    const results = await client.query(
        `WITH top_n_relevant AS (
            SELECT
                id,
                1 - (embedding <=> $1) AS similarity_score
            FROM embeddings
            WHERE 1 - (embedding <=> $1) > 0.6
            ORDER BY embedding <=> $1
            LIMIT ($2*4) -- Multiply *4 because may be by the usage of keywords can be repeated on the same ID and to no only get one ID expand the limit and by probability I will get more ID's
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
            pgvector.toSql(query_embedding_data),
            n_results
        ]
    );

    return results.rows;
}