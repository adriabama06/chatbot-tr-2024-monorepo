*Note: This git contains all the code from my reseach work of baccalaureate but censored, without names, and not git history*
# chatbot-tr-2024-webdataextract
* Bascially extract the data from a wordpress page, in this case my High school wordpress page.
* Where there is HIDDEN in reality there mus be the name of my High school, but for securty I had remove that
Extract the data to use in the RAG 
## Things to add:
- [ ] Use all the RAG in english?
- [x] Use the LLM reader-lm to convert from HTML to MarkDown (better than my code)

## How run:
```
$ node index.js
$ node util/cleanup_posts.js data.json
$ node util/generate_keywords.js data_cleanup.json
$ node util/remove_repeated_keywords.js data_keywords.json
$ # data_remove_repeated_keywords.json Must be de final data.json version, data_remove_repeated_keywords.json is what you need to put in the RAG
```