import { Router } from "express";
import fs from "fs";

const router = Router();

router.post("/store", async (req, res) => {
    var unique_name = (req.body.user ?? (req.ip ?? new Date().toJSON().replace(/:/g, "_").split(".")[0])) + `_${req.body.model.replace(":", "dotdot")}_id0`;

    for(var i = 1; fs.existsSync(`store/${unique_name}.json`); i++) {
        unique_name = unique_name.split("_id")[0] + "_id" + i.toString();
    }

    fs.writeFileSync(`store/${unique_name}.json`, JSON.stringify(req.body.data));

    res.status(200).json({
        error: false,
        data: `store/${unique_name}.json`
    });
});

export default router;