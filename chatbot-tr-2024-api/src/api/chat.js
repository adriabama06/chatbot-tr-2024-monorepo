import { Router } from "express";
import { inference_chat, inference_chat_stream } from "../providers.js";

const API_DEBUG = process.env.API_DEBUG ?? "none";

const RAG_API = process.env.RAG_API;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

const router = Router();

// Start Interfaces
// https://goulet.dev/posts/how-to-write-ts-interfaces-in-jsdoc/

/**
 * @typedef Message
 * @prop {"user" | "assistant"} role
 * @prop {string} content
 */

/**
 * @typedef {{
 *  id: number,
 *  content: string,
 *  title: string,
 *  post_date: string,
 *  article_url: string,
 *  similarity_score: number
 * }} RelevantDocument
 */

// End Interfaces

/**
 * @param {any} message 
 * @returns {message is Message}
 */
function isMessage(message) {
    return (
        typeof message.role == "string" && (message.role == "user" || message.role == "assistant")
        && typeof message.content == "string"
    )
}

const SYSTEM_MESSAGE = 
`# Role
You are a conversational AI designed to assist the users of the HIDDEN website, it always tries to answer in the same language as the user, in a friendly way helping the user as best as possible. Today is ${new Date().toJSON().split("T")[0].split("-").reverse().join("-")}.

# Task
1. You must assist the user by trying to provide an informed response to the user as best as possible
2. In each user entry you will have "<context>" which are results of a search on the institute's page that should help you answer the user's "Query", this serves you to improve answers.
3. Your message must be friendly, formal, explanatory, without removing important or relevant information for the user's query.

# Basic information
The HIDDEN, is an institute where students study from 1st to 4th year of ESO, and also 1st and 2nd year of Baccalaureate.
The institute is located at HIDDEN, the contact number is HIDDEN and the contact email is HIDDEN.

# Notes
- If you don't know something don't try to invent an answer and directly say that you don't know.
- Always try to answer in the same language as the user.
- In your answer remember to use the links shown in the "<context>" to indicate to the user where to go.
- If they do NOT ask you directly where the institute is located or they do NOT directly ask for the institute's contact information, do not give them.
- Always try to explain step by step.`;

/**
 * @returns {string}
 * @param {string[]} context
 * @param {string} content
 */
function generate_rag_template(context, content) {
    if(context.length == 0) {
        return content;
    }

    var str = "Use the following context as your learned knowledge, inside <context></context> XML tags.\n<context>";

    for(const text of context) {
        str += "\n";
        str += "    " + text.replace(/\n/g, "\n    ");
        str += "\n";
    }

    str +=
`</context>

When answer to user:
 - If you don't know, just say that you don't know.
 - If you don't know when you are not sure, ask for clarification.
 - Always try to answer in the same language as the query.
Avoid mentioning that you obtained the information from the context.
And answer according to the language of the user's query.

Given the context information, answer the query.
Query: ${content}`

    return str;
}

/**
 * @returns {string | undefined}
 * @param {RelevantDocument} doc 
 */
function document_template(doc) {
    if(!doc) return;

    const date = doc.post_date.split("T");
    const date_str = date[0].split("-").reverse().join("-") + " " + date[1].split(".")[0] + " (24h)";

    var str = `Title: ${doc.title}\nPublish date: ${date_str}\nURL: ${doc.article_url}\nContent: ${doc.content}`;

    return str;
}

/**
 * @returns {Message[]}
 * @param {any} body
 */
function filter_chat(body) {
    /**
     * @type {Message[]}
     */
    var messages = [];

    if(!body.messages || !Array.isArray(body.messages)) {
        return [];
    }

    for(const message of body.messages) {
        if(!isMessage(message)) continue;

        messages.push({ role: message.role, content: message.content });
    }

    return messages;
}

/**
 * @type {Map<string, RelevantDocument[]>}
 */
var query_cache = new Map();

/**
 * @returns {Promise<RelevantDocument[]>}
 * @param {string} query 
 * @param {number?} n_results 
 */
async function get_relevant_documents(query, n_results = 5) {
    if(!query) return [];

    if(query_cache.has(`${n_results}-${query}`)) return query_cache.get(`${n_results}-${query}`);

    try {
        const res = await fetch(RAG_API + "/query", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                n_results
            })
        });

        if(res.status != 200) return [];

        const body = await res.json();

        if(body.error) {
            return [];
        }

        query_cache.set(`${n_results}-${query}`, body.data);

        return body.data;
    } catch (err) {
        if(API_DEBUG == "errors") {
            console.error(`Error fetching ${RAG_API}/query ("${query}", ${n_results})`);
            console.error(err);
        }
    }

    return [];
}

/**
 * @returns {Promise<string[]>} 
 * @param {string} query 
 * @param {number?} n_results
 */
async function get_context(query, n_results = 5) {
    var context = [];

    if(!query) return context;

    const documents = await get_relevant_documents(query, n_results);

    for(const doc of documents) {
        context.push(
            document_template(doc)
        );
    }

    return context;
}

router.post("/chat", async (req, res) => {
    const model = req.body.model;
    const stream = (req.query.stream && req.query.stream == "false") ? false : true;
    const provider = req.body.provider ?? (process.env.DEFAULT_PROVIDER?.length > 0 ? process.env.DEFAULT_PROVIDER :  "ollama");

    if(!["ollama", "groq", "openai"].includes(provider)) {
        res.status(400).json({
            error: true,
            data: "Invalid provider"
        });
        return;
    }

    var messages = filter_chat(req.body);

    if(messages.length == 0) {
        res.status(400).json({
            error: true,
            data: "Invalid messages format"
        });
        return;
    }

    // Last element must be user
    const query = messages[messages.length - 1];

    if(query.role != "user") {
        res.status(400).json({
            error: true,
            data: "Last message: Invalid messages order"
        });
        return;
    }

    // Add to every user message it context
    for(const message of messages) {
        if(message.role != "user") continue;

        // Maybe use duckduck go as RAG search and from the processed database extract the data? ex: (inscripció al batxillerat a l'HIDDEN "2024" site:https://HIDDEN/)
        const context = await get_context(query.content, !isNaN(parseInt(req.query.n_results)) ? parseInt(req.query.n_results) : 3);

        if(context.length > 0) {
            message.content = generate_rag_template(context, message.content);
        }
    }    

    if(SYSTEM_MESSAGE) {
        messages = [
            { role: "system", content: SYSTEM_MESSAGE },
            ...messages
        ]
    }

    if(!stream) {
        const chat_response = await inference_chat(messages, provider, model);

        if(!chat_response || !chat_response.content || !chat_response.role) {
            console.log(chat_response);
            console.log(stream);
            console.log(messages);
            console.trace("Error on ollama request");
            res.status(500).json({
                error: true,
                data: "Error fix in develop, chat.js (!chat_response || !chat_response.content || !chat_response.role)"
            });
            return;
        }

        res.status(200).json({
            error: false,
            data: {
                done: true,
                role: chat_response.role,
                content: chat_response.content
            }
        });
        return;
    }

    var chat_response_generator = undefined;

    try {
        chat_response_generator = await inference_chat_stream(messages, provider, model);

        if(!chat_response_generator) throw "Error: Chat response generator";
    } catch (err) {
        res.status(500).json({
            error: true,
            data: "Error on create chat response generator"
        });
        return;
    }

    res.writeHead(200, {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked"
    });

    for await (const part of chat_response_generator) {
        var done = false;
        var role = "";
        var content = "";

        switch (provider) {
            case "ollama":
                done = part.done;
                role = part.message.role;
                content = part.message.content;
                break;

            case "groq":
            case "openai":
                role = "assistant"
                content = part.choices[0].delta.content
                done = (part.choices[0].finish_reason && part.choices[0].finish_reason == "stop") ? true : false;
                break;

            default:
                break;
        }

        res.write(
            JSON.stringify({
                error: false,
                data: {
                    done,
                    role,
                    content
                }
            }) + "\n"
        );

        if(done) break;
    }

    if(chat_response_generator.controller) chat_response_generator.controller.abort();
    else chat_response_generator.abort();

    res.end();
});

export default router;
