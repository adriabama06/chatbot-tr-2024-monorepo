import { OLLAMA_MODEL, OLLAMA_PROVIDERS, get_ollama_provider, get_ollama_provider_running_model } from "./ollama.js";

import OpenAI from "openai";

const PROVIDER_URL = {
    "groq": "https://api.groq.com/openai/v1",
    "openai": (process.env.CUSTOM_OPENAI_URL?.length > 0) ? process.env.CUSTOM_OPENAI_URL : "https://api.openai.com/v1"
};

const PROVIDER_KEY = {
    "groq": process.env.GROQ_API_KEY,
    "openai": process.env.OPENAI_API_KEY
}

const PROVIDER_DEFAULT_MODEL = {
    "groq": process.env.GROQ_MODEL,
    "openai": process.env.OPENAI_MODEL
}

const CONTEXT_LENGTH = process.env.CONTEXT_LENGTH ? Math.round(eval(process.env.CONTEXT_LENGTH)) : (8 * 1024);
const TEMPERATURE = (process.env.TEMPERATURE && !isNaN(parseFloat(process.env.TEMPERATURE))) ? parseFloat(process.env.TEMPERATURE) : 0.2;
const OLLAMA_KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE ?? "30m";

console.log(`providers.js -> Using CONTEXT_LENGTH: ${CONTEXT_LENGTH}; TEMPERATURE: ${TEMPERATURE}`);

if(OLLAMA_PROVIDERS.length > 0) {
    console.log(`providers.js -> Using OLLAMA_KEEP_ALIVE: ${OLLAMA_KEEP_ALIVE}`);
}

/**
 * @returns {Promise<undefined | import("./api/chat").Message>}
 * @param {import("./api/chat").Message[]} messages 
 * @param {"ollama" | "groq" | "openai"} provider 
 * @param {string?} model Use another model to not use the ENV model
 */
export async function inference_chat(messages, provider = "ollama", model) {
    switch (provider) {
        case "ollama":
            var ollama = await get_ollama_provider_running_model(model);
            if (!ollama) ollama = await get_ollama_provider(model);
            if (!ollama) return false;
            return (await ollama.chat({
                model: model ?? OLLAMA_MODEL,
                messages: messages,
                keep_alive: OLLAMA_KEEP_ALIVE,
                options: {
                    num_ctx: CONTEXT_LENGTH,
                    temperature: TEMPERATURE
                },
                stream: false
            })).message;

        case "groq":
        case "openai":
            return (await new OpenAI({
                baseURL: PROVIDER_URL[provider],
                apiKey: PROVIDER_KEY[provider]
            }).chat.completions.create({
                model: model ?? PROVIDER_DEFAULT_MODEL[provider],
                messages: messages,
                stream: false,
                temperature: TEMPERATURE
            })).choices[0].message;
        default:
            return undefined;
    }
}

/**
 * @param {import("./api/chat").Message[]} messages 
 * @param {"ollama" | "groq" | "openai"} provider 
 * @param {string?} model Use another model to not use the ENV model
 */
export async function inference_chat_stream(messages, provider = "ollama", model) {
    switch (provider) {
        case "ollama":
            var ollama = await get_ollama_provider_running_model(model);
            if (!ollama) ollama = await get_ollama_provider(model);
            if (!ollama) return false;
            return await ollama.chat({
                model: model ?? OLLAMA_MODEL,
                messages: messages,
                keep_alive: OLLAMA_KEEP_ALIVE,
                options: {
                    num_ctx: CONTEXT_LENGTH,
                    temperature: TEMPERATURE
                },
                stream: true
            });

        case "groq":
        case "openai":
            return await new OpenAI({
                baseURL: PROVIDER_URL[provider],
                apiKey: PROVIDER_KEY[provider]
            }).chat.completions.create({
                model: model ?? PROVIDER_DEFAULT_MODEL[provider],
                messages: messages,
                stream: true,
                temperature: TEMPERATURE
            });
        default:
            return undefined;
    }
}