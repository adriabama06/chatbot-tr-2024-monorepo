const DEFAULT_LANGUAGE = "en";

const USER_LANGUAGE = ((navigator.language || navigator.userLanguage) ?? DEFAULT_LANGUAGE).split("-")[0].toLowerCase();

const LANGUAGES = {
    // Catalan
    ca: {
        title: "Treball de recerca | XatBot 2023-2025",
        inital_message: `Hola! Sóc l'assistent virtual de l'HIDDEN. Estic aquí per ajudar-te amb qualsevol dubte o consulta que tinguis sobre l'institut. Ja sigui informació sobre els cursos, esdeveniments, horaris, o qualsevol altra pregunta, estaré encantat d'assistir-t'hi. Si us plau, digues-me en què puc ajudar-te avui.`,
        cant_start_chat: "Error intern del servidor al iniciar la conversació amb el XatBot",
        textbox_placeholder: "Escriu aquí el teu missatge"
    },
    // Spanish
    es: {
        title: "Trabajo de investigación | ChatBot 2023-2025",
        inital_message: `¡Hola! Soy el asistente virtual del HIDDEN. Estoy aquí para ayudarte con cualquier duda o consulta que tengas sobre el instituto. Ya sea información sobre los cursos, eventos, horarios, o cualquier otra pregunta, estaré encantado de asistirte. Por favor, dime en qué puedo ayudarte hoy.`,
        cant_start_chat: "Error interno del servidor al iniciar la conversación con el ChatBot",
        textbox_placeholder: "Escribe aquí tu mensaje"
    },
    // English
    en: {
        title: "Research work | ChatBot  2023-2025",
        inital_message: `Hello! I am the virtual assistant of the HIDDEN. I am here to help you with any questions or queries you may have about the institute. Whether it is information about courses, events, schedules, or any other questions, I will be happy to assist you. Please let me know how I can help you today.`,
        cant_start_chat: "Internal error of the server on start the conversation with the ChatBot",
        textbox_placeholder: "Write there your message"
    }
}

const AVAILABLE_LANGUAGES = Object.keys(LANGUAGES);

export function GetText(textId) {
    return AVAILABLE_LANGUAGES.includes(USER_LANGUAGE) ? LANGUAGES[USER_LANGUAGE][textId] : LANGUAGES[DEFAULT_LANGUAGE][textId];
}

document.documentElement.lang = USER_LANGUAGE; // set html lang=USER_LANGUAGE
document.title = GetText("title");
