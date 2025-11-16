import { useState, useRef, useEffect } from "react";

import send_message_icon from "./assets/send_message.svg"

import Message from "./components/Message";
import { ChatResponseIterator } from "./api/chat";
import { GetText } from "./locales";

function App() {
    /**
     * @type {[import("./api/chat").Message[], Dispatch<SetStateAction<import("./api/chat").Message[]>>]}
     * Current mesasges
     */
    const [messages, setMessages] = useState([]);

    // textbox input
    const [inputMessage, setInputMessage] = useState("");

    // enable / disable send button using "done", done changes if the LLM is generating an answer or not
    const [done, setDone] = useState(true);

    // Use reference element to scroll down in the chat when is required
    const scrollDownElement = useRef(null);

    // get chatbox reference to get current scroll position
    const chatboxRef = useRef(null);

    /**
     * This function calculates the remaining scroll distance from the bottom of the chatbox element, and returns remaining scroll distance from the bottom of the chatbox element.
     */
    const getChatboxScroll = () => {
        // Check if the chatbox reference element exists
        if (!chatboxRef.current) return 0;

        // Get total height aviable on the chatbox, distannce respect the top of the scroll, the screen extra pixels
        const { scrollHeight, scrollTop, clientHeight } = chatboxRef.current;

        // Total height - distance scrolled from top - window size
        return scrollHeight - scrollTop - clientHeight;
    }

    // Store the previous scroll top position
    var prevScrollTop = 0;

    // This function calculates the increment in scroll top position since the last call
    const getChatboxScrollIncrement = () => {
        // Check if the chatbox reference element exists
        if (!chatboxRef.current) return 0;

        // Get distance scrolled from top
        const { scrollTop } = chatboxRef.current;

        // Calculate the increment
        const increment = scrollTop - prevScrollTop;

        // Update the previous scroll top position
        prevScrollTop = scrollTop;

        // Return the increment in scroll top position
        return increment;
    }

    const sendMessage = async (e) => {
        if (e) e.preventDefault();

        // Prevent send empty messages
        if(inputMessage.replace(/ /g, '') == "") return;

        // If is already handling a request wait until end the last request
        if (!done) return;
        setDone(false);

        // Create a new array with the current messages and the new user message
        const currentMessages = [...messages, { role: "user", content: inputMessage }];

        // Create an object to hold the assistant's response
        var assistantMessage = {
            role: "assistant",
            content: ""
        }

        // Update the state with the new messages, including the user's message
        setMessages(currentMessages);
        // Clear the input field
        setInputMessage("");

        // Scroll down to the bottom of the chat after a small delay
        setTimeout(() => scrollDownElement.current?.scrollIntoView({ behavior: "smooth" }), 100); // Add a very small delay


        try {
            const messagesIterator = ChatResponseIterator(currentMessages);

            var stopThinkingAnimation = false;

            // Do animation adding dots to emulate thinking while the server process the request and the LLM process the input
            const thinkingAnimation = setInterval(() => {
                if(stopThinkingAnimation) {
                    clearInterval(thinkingAnimation);

                    return;
                }

                assistantMessage.content += ". ";

                if (assistantMessage.content.replace(/ /g, '') === "....") {
                    assistantMessage.content = ". ";
                }

                // Update the state with the new messages, including the assistant response
                setMessages([...currentMessages, assistantMessage]);
            }, 500);

            // Set the delay time for scrolling
            const SCROLL_DELAY_TIME = 1000 / 30; // 33.3333.... ms

            // Store the time of the last message
            var lastMessageTime = new Date().getTime();

            var firstsMessagesCount = 0;
            const MAX_CONSIDERED_FIRSTS_MESSAGES = 15;

            // Iterate over the chat response
            for await (const message of messagesIterator) {
                // When start, clear interval and clear content
                if(!stopThinkingAnimation) {
                    stopThinkingAnimation = true;

                    assistantMessage.content = "";
                }

                var BOTTOM_RANGE = 0;

                // this line is for: [FMC_USAGE] <-- Search in the code
                if (firstsMessagesCount < MAX_CONSIDERED_FIRSTS_MESSAGES) {
                    firstsMessagesCount++;
                    BOTTOM_RANGE = 140;
                } else {
                    BOTTOM_RANGE = 60;
                }

                // Get the current time
                const currentMessageTime = new Date().getTime();

                // Append the new message content to the assistant's response
                assistantMessage.content += message.content;

                // Update the state with the new messages, including the assistant's response
                setMessages([...currentMessages, assistantMessage]);

                // If the user is scrolling up, reset the last message time
                if (getChatboxScrollIncrement() < 0) { // the user is tryng to go up (cords: scroll DOWN positive, scroll UP negative) => increment < 0 => User is trying to scroll up
                    lastMessageTime = currentMessageTime + (4 * SCROLL_DELAY_TIME); // reset the time to re-check the position
                }

                // FMC_USAGE --> Down && ->> FMC_USAGE <<- This don't mean any thing, is only used to identify
                // Check if enough time has elapsed to scroll down
                if ((currentMessageTime - lastMessageTime) > SCROLL_DELAY_TIME) { // check elapsed time in miliseconds (to learn check my project image-to-ascii)
                    // Check if the chatbox is close to the bottom, if is one of firsts messages, give a range of 140 instance of 60
                    if (getChatboxScroll() < BOTTOM_RANGE) {
                        // Scroll down to the bottom of the chat
                        scrollDownElement.current?.scrollIntoView();
                    }
                }
            }
        } catch (err) {
            // Log errors
            console.error(err);

            if (err == "No response") {
                alert("Error intern del servidor al iniciar la conversació amb el ChatBot");
            }
        }

        // Re-enable the button
        setDone(true);
    }

    const onEnterPress = (e) => {
        // If press ENTER without pressing shift, then execute sendMessage
        if (e.keyCode == 13 && e.shiftKey == false) {
            e.preventDefault();
            sendMessage();
        }
    }

    const [initalMessageContent, setInitalMessageContent] = useState("");
    
    const simulateInitalMessageWrite = async () => {
        const message = GetText("inital_message");

        const MESAGE_CHUNKS = 4;
        const CHUNKS_PER_SECOND = message.length / 3 / MESAGE_CHUNKS;

        for(var i = 0; i < (message.length/MESAGE_CHUNKS); i++) {
            await new Promise((resolve) => setTimeout(resolve, 1000/CHUNKS_PER_SECOND));

            setInitalMessageContent(message.slice(0, i*MESAGE_CHUNKS));
        }

        setInitalMessageContent(message);
    }
    
    useEffect(() => { simulateInitalMessageWrite() }, []);

    return (
        <div className="container">
            <div>
                <div className="chatbox-outerline">
                    <div className="chatbox" ref={chatboxRef}>
                        <Message key="inital_message" role="assistant" content={initalMessageContent} />

                        {messages.map((msg, i) => <Message key={i} role={msg.role} content={msg.content} />)}

                        <span ref={scrollDownElement}></span>
                    </div>
                </div>

                <form onSubmit={sendMessage}>
                    <textarea rows={1} value={inputMessage} onKeyDown={onEnterPress} onChange={(e) => setInputMessage(e.target.value)} placeholder={GetText("textbox_placeholder")} />

                    <button type="submit" disabled={(done != true || inputMessage.length == 0 || inputMessage.replace(/ /g, '') == "")}>
                        <img src={send_message_icon} alt="Enviar"></img>
                    </button>
                </form>
            </div>
        </div>
    )
}

export default App;
