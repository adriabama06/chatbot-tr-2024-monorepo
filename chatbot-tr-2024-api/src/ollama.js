import { Ollama } from "ollama";

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

/**
 * @type {string[]}
 */
export const OLLAMA_PROVIDERS = process.env.OLLAMA_PROVIDERS?.split(",") ?? [];
var OLLAMA_PROVIDERS_INDEX = 0; // Used to rotate betwen hosts to no overload only one

if(OLLAMA_PROVIDERS.length > 0) {
    console.log(`ollama.js -> Using OLLAMA_PROVIDERS: ${OLLAMA_PROVIDERS.join(", ")}`);
}

/**
 * @returns {Promise<undefined | Ollama>}
 * @param {number?} count Never use this parameter or use 0, this is a recursive function
 * @param {string?} model By default uses OLLAMA_MODEL
 */
export async function get_ollama_provider(model = OLLAMA_MODEL, count = 0) {
    if (count >= OLLAMA_PROVIDERS.length) return undefined;

    try {
        const provider = OLLAMA_PROVIDERS[OLLAMA_PROVIDERS_INDEX++]
        if (OLLAMA_PROVIDERS_INDEX >= OLLAMA_PROVIDERS.length) OLLAMA_PROVIDERS_INDEX = 0;

        const ollama = new Ollama({
            host: provider
        });

        const models = (await ollama.list()).models;

        if (!models.some(m => m.name == model)) {
            console.error(`Fatal: Model ${model} is not in ${provider}`);
            return await get_ollama_provider(model, ++count);
        }

        return ollama;
    } catch {
        return await get_ollama_provider(model, ++count); // try to return another provider
    }
}

/**
 * @returns {Promise<undefined | Ollama>}
 * @param {string?} model By default uses OLLAMA_MODEL
 */
export async function get_ollama_provider_running_model(model = OLLAMA_MODEL) {
    for (const provider of OLLAMA_PROVIDERS) {
        try {
            const ollama = new Ollama({
                host: provider
            });

            const running_models = await ollama.ps();
    
            if (running_models.models.some(m => m.name == model)) {
                return ollama;
            }
        } catch {
            console.log(`Warning ollama provider: ${provider}`);
        }
    }

    return undefined; // No providers found
}