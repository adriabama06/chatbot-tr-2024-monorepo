*Note: This git contains all the code from my reseach work of baccalaureate but censored, without names, and not git history*
## How to run:
Download the embedding model in the .env file in ollama or in the provider: `ollama pull bge-m3`
```
$ docker compose up -d
$ docker compose exec chatbot-rag-server node util/data_upload.js
```

TODO:
- TEST MORE embedding's model (https://huggingface.co/jinaai/jina-embeddings-v3 seems to be interesting, or https://huggingface.co/Snowflake/snowflake-arctic-embed-l-v2.0 / https://ollama.com/library/snowflake-arctic-embed2)
- Use vLLM instance of transformers.js or ollama for embedding?

Words to use:
- Com puc inscriure al meu fill?
- Com em puc apuntar al menjador?
- Quan es el menjador?
- Como puedo inscribirme?
- Inscribir ESO
- Inscribir Batchillerato
- A que hora es el comdedor?
- Que han fet els alumnes de 3 d'ESO
