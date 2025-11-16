import express from "express";
import cors from "cors";
import { pgvector_query } from "./rag.js";

const PORT = process.env.PORT ?? 80;

const app = express();

app.use(express.json());
app.use(cors()); // https://medium.com/zero-equals-false/using-cors-in-express-cac7e29b005b
app.disable("x-powered-by");

app.get("/", async (req, res) => {
    res.status(200).json({
        error: false,
        data: "Server is running"
    });
});

app.post("/query", async (req, res) => {
    var { query, n_results } = req.body;
    if(!n_results || typeof n_results != "number" || n_results > 10) n_results = 5;

    if(!query || typeof query != "string") {
        res.status(400).json({
            error: true,
            data: "No \"query\" or is not a string"
        });
        return;
    }

    const documents = await pgvector_query(query, n_results);

    const documents_ordered = documents.toSorted((a,b) => b.similarity_score - a.similarity_score);

    res.status(200).json({
        error: false,
        data: documents_ordered
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RAG API] Ready at port :${PORT}`);
});
