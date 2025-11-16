import OpenAI from "openai";
import TurndownService from "turndown";

import { correct_words, remove_html_br_tag } from "./html.js";

const PROVIDER_HOST = "http://192.168.1.155:8000";
const MODEL = "jinaai/reader-lm-1.5b";
const TEMPERATURE = 0;
const APIKEY = "-";

const client = new OpenAI({
    baseURL: PROVIDER_HOST + "/v1",
    apiKey: APIKEY
});

/**
 * 
 * @param {string} text 
 * @param {"llm" | "turndown"} option 
 * @returns {Promise<string>}
 */
export async function html_to_markdown(text, option = "llm") {
    const fixed_text = remove_html_br_tag(correct_words(text)).replace(/ +/g, ' ').trim();

    if(option == "turndown") {
        const turndownService = new TurndownService();

        return turndownService.turndown(fixed_text);
    }

    const parsed = await client.chat.completions.create({
        model: MODEL,
        temperature: TEMPERATURE,
        stream: false,
        messages: [
            {
                role: "user",
                content: fixed_text
            }
        ]
    });

    return parsed.choices[0].message.content;
}