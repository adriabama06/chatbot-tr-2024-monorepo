const REMOVE_KEYWORDS = [
    "HIDDEN",
    "HIDDEN",
    "HIDDEN",
    "HIDDEN",
    "HIDDEN",
    "institut HIDDEN"
];

import fs from "fs";
import path from "path";

const CUSTOM_KEYWORDS = JSON.parse(
    fs.readFileSync("./keywords.json")
);

/**
 * @returns {string[]}
 * @param {string} id
 */
function get_keywords(id) {
    return CUSTOM_KEYWORDS[id] ?? [];
}

import OpenAI from "openai";

const PROVIDER_HOST = "http://192.168.1.154:8000";
const MODEL = "Aaron2599/Meta-Llama-3.1-8B-Instruct-TurboMind-AWQ-4bit";
const TEMPERATURE = 0;
const APIKEY = "-";

const client = new OpenAI({
    baseURL: PROVIDER_HOST + "/v1",
    apiKey: APIKEY
});

function ask_template(title, content) {
    return (
        `Ets un generador de "paraules clau" pel sistema de cerca de la pàgina web de l'HIDDEN, per tant, hauràs de crear frases rellevants que es puguin fer servir per indexar el que es demani, en les respostes pots incloure la classe, o sobre quins han fet l'activitat.

A partir del post, genera una llista de dubtes que es puguin fer els usuaris (fent servir el punt de vista de pares i alumnes) i paraules clau sobre aquest post.

Aquí tens idees per preguntes que pots posar:
\`\`\`
* Que han fet en x cosa?
* Que han fet els alumens de x clase?
* Com m'inscrbo a x cosa?
* Com m'apunto a x cosa?
* Quan es fara x cosa?
* Fins quan esta disponible x cosa?
* Es podra fer x cosa?
* Com funciona x cosa?
\`\`\`

La sortida ha de tenir ser solament la llista de peguntes, res més.

La sortida ha de tenir el següent format:
\`\`\`
* Pregunta 1
* Pregunta 2
* Pregunta 3
...
\`\`\`

Post:
\`\`\`
Titol:
${title}

Contingut:
${content}
\`\`\``
    );
}

/**
 * @returns {string[]}
 * @param {string} response 
 */
function split_response(response) {
    var result = [];

    const response_split = response.split("* ");

    for (var i = 1; i < response_split.length; i++) {
        result.push(response_split[i].replace(/\n/g, ' ').replace(/ +/g, ' ').trim());
    }

    return result;
}

/**
 * @returns {string[]}
 * @param {string[]} keywords 
 */
function clean_keywords(keywords) {
    var clean = [];

    for (const keyword of keywords) {
        if (REMOVE_KEYWORDS.includes(keyword.toLowerCase())) continue; // Remove special keywords

        var keyword_clean = keyword;

        for (const remove_keyword of REMOVE_KEYWORDS) {
            keyword_clean = keyword_clean.replace(
                new RegExp(remove_keyword, "gi"),
                ''
            );
        }

        if (clean.find(element => element.toLowerCase() == keyword_clean.toLowerCase())) continue; // Not repeat keywords

        clean.push(keyword_clean);
    }

    return clean;
}

/**
 * @returns {Promise<string[]>}
 * @param {number} id
 * @param {string} title 
 * @param {string} content 
 */
export async function generate_keywords(id, title, content) {
    const ask = await client.chat.completions.create({
        model: MODEL,
        temperature: TEMPERATURE,
        stream: false,
        messages: [
            {
                role: "user",
                content: ask_template(title, content)
            }
        ]
    });

    var keywords = split_response(ask.choices[0].message.content);

    keywords.push(...get_keywords(id.toString()));

    keywords = clean_keywords(keywords);

    return keywords;
}

/**
 * @returns {Promise<Array<string[]>>}
 * @param {Array<{id: string, title: string, content: string}>} posts
 */
export async function generate_keywords_batch(posts) {
    // 1. Build JSONL lines
    const lines = posts.map(post => {
        const body = {
            model: MODEL,
            temperature: TEMPERATURE,
            messages: [
                { role: "user", content: ask_template(post.title, post.content) }
            ],
            stream: false
        };

        return JSON.stringify({
            custom_id: post.id,
            method: "POST",
            url: "/v1/chat/completions",
            body
        });
    });

    // 2. Write to a temporary JSONL file
    const tmpFile = path.join(process.cwd(), `batch_${Date.now()}.jsonl`);
    fs.writeFileSync(tmpFile, lines.join("\n"));

    // 3. Upload file with purpose "batch"
    const batchFile = await client.files.create({
        file: fs.createReadStream(tmpFile),
        purpose: "batch"
    });

    // 4. Create the batch job
    const batchJob = await client.batches.create({
        input_file_id: batchFile.id,
        endpoint: "/v1/chat/completions",
        completion_window: "24h"
    });

    // 5. Poll status until done
    var time_start = Date.now();
    let status;
    do {
        await new Promise(r => setTimeout(r, 5000));
        status = await client.batches.retrieve(batchJob.id);

        const elapsed_ms = (Date.now() - time_start);
        const total_time_aprox = status.request_counts.total / (status.request_counts.completed / elapsed_ms);

        const time = new Date(Math.abs(total_time_aprox - elapsed_ms));

        console.log(`${status.request_counts.completed}/${status.request_counts.total} - ${new Date(elapsed_ms).toGMTString().substring(17, 25)} elapsed of expect remain ${time.toGMTString().substring(17, 25)} (hour:min:sec)`);
    } while (status.status !== "completed" && status.status !== "failed");

    if (status.status === "failed") {
        throw new Error(`Batch job failed: ${JSON.stringify(status)}`);
    }

    // 6. Download results
    const output = await client.files.content(status.output_file_id);
    const linesOut = output.trim().split("\n").map(JSON.parse);

    // 7. Map results back to input posts
    const results = posts.map(post => {
        const entry = linesOut.find(r => r.custom_id === post.id.toString());
        let keywords = [];
        if (entry.body && entry.body.choices?.[0]?.message?.content) {
            keywords = split_response(entry.body.choices[0].message.content);
        }
        keywords.push(...get_keywords(post.id.toString()));
        keywords = clean_keywords(keywords);
        return keywords;
    });

    // Cleanup temp file
    fs.unlinkSync(tmpFile);
    return results; // returns Array<string[]>, parallel to posts input
}