import express from "express";
import cors from "cors";

import chat_route from "./api/chat.js";
import store_route from "./api/store.js";

const PORT = process.env.PORT ?? 80;
const HOST = process.env.HOST ?? "0.0.0.0";

const app = express();

app.use(express.json());
app.use(cors()); // https://medium.com/zero-equals-false/using-cors-in-express-cac7e29b005b
app.disable("x-powered-by");
app.set('trust proxy', process.env.TRUST_PROXY?.split(",") ?? []); // https://expressjs.com/en/guide/behind-proxies.html

app.use("/", chat_route);
app.use("/", store_route);

app.get("/", (req, res) => {
    res.status(200).json({
        error: false,
        data: "Server is running"
    });
});

app.listen(PORT, HOST, () => {
    console.log(`index.js -> Server ready at: ${HOST}:${PORT}`);
    if(process.env.TRUST_PROXY) {
        console.log(`index.js -> Trusted proxy's: ${process.env.TRUST_PROXY.split(",").join(", ")}`);
    }
});
