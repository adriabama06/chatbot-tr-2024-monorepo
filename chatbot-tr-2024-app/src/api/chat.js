// Start Interfaces

/**
 * @typedef Message
 * @prop {"user" | "assistant"} role
 * @prop {string} content
 */

// End Interfaces

/**
 * @param {any} message 
 * @returns {message is Message}
 */
export function isMessage(message) {
    return (
        typeof message.role == "string" && (message.role == "user" || message.role == "assistant")
        && typeof message.content == "string"
    );
}

/**
 * @param {Message[]} messages
 * @param {true | false} stream
 */
export async function ChatResponse(messages, stream = true) {
    const provider = new URL(window.location.href).searchParams.get("provider") ?? undefined
    const model = new URL(window.location.href).searchParams.get("model") ?? undefined;

    try {
        const response = await fetch(`${import.meta.env.VITE_CHATBOT_API}/chat?stream=${stream}`, {
            method: "POST",
            redirect: "follow",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages, model, provider })
        });

        return response;
    } catch (err) {
        console.error(err, messages);
        return undefined;
    }
}

/**
 * @param {Message[]} messages
 * @throws {string}
 */
export async function* ChatResponseIterator(messages) {
    // Send the messages to the chatbot API and await the response
    const response = await ChatResponse(messages);

    if(!response || response.status != 200) {
        throw "No response";
    }

    // Get a reader for the response body stream
    const reader = response.body.getReader();

    while(true) {
        // Read the next chunk of data from the response stream
        const part = await reader.read();

        // If there are no more chunks, break out of the loop
        if(part.done) break;

        // Split the chunk of data into lines
        const bodyParts = new TextDecoder().decode(part.value).split(/\n/g);

        // Iterate over each line
        for(const body of bodyParts) {
            // Skip empty lines
            if(body == "") continue;
    
            try {
                // Parse the line as JSON
                const { data } = JSON.parse(body);

                // If the parsed data is falsy or does not match the Message interface, skip it
                if(!data || !isMessage(data)) continue;

                // Yield the parsed data as a Message
                yield data;
            } catch (err) {
                // Log any errors that occur during parsing
                console.error("Error parsing", { body });
            }
        }
    }
}