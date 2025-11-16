*Note: This git contains all the code from my reseach work of baccalaureate but censored, without names, and not git history*
# chatbot-tr-2024-api

NOTE: Hey! The final LLM that I used was `qwen2.5:7b-instruct-q8_0`. Is very good at catalan and the answers are very good.

TODO:
- Reduce top K of the RAG (first improve the RAG accuracy like generate a search based on user input instance of sending the user input to the rag), and also cut the context like: [system, a, b, c, d, e, f] -> [system, d, e, f]
- Maybe change to use vLLM (Tested and works AMAZING is very fast and can handle multiple request without a performarce loss)
- Use new LLM models?
- Start using TOOLS from the model to do the search, this will allow new posibilites, for example: Q: What have you done in the last week?. A: [Use tool to send SQL Query or a preprogramed function to give a correct answer]

# Prerequisites:
- Optional but recommended: [Docker](https://docs.docker.com/engine/install/)
- [Ollama](https://ollama.ai/)
- [llama3](https://ollama.com/library/llama3:8b-instruct-q8_0) or any other model installed on ollama, recommendations: 
- [chatbot-tr-2024-rag](https://github.com/adriabama06/chatbot-tr-2024-rag)

## Setup Ollama
```bash
docker run -dt --gpus=all --restart unless-stopped --name ollama -v ~/.ollama:/root/.ollama -p 11434:11434 ollama/ollama
```

## Download llama3 or any model
```bash
docker exec -it ollama ollama run llama3:8b-instruct-q8_0
```

# Deploy:
Rename .env.default to .env, edit the .env file, and set up the variables with your values, once that, you can run:
```bash
docker compose up -d
```

To stop, only run:
```bash
docker compose down --rmi all # --rmi all <-- To clean all
```
