import cors from "cors";
import express from "express";
import { config } from "config";
import { BDaySync } from "./bdaysync";
import { configDotenv } from "dotenv";
// import * as https from "https";
// import * as fs from "fs";


configDotenv();

const sync = new BDaySync();

const app = express();
app.use(cors());

// const certificate = fs.readFileSync("/etc/letsencrypt/live/mastercal.xyz/fullchain.pem");
// const privateKey = fs.readFileSync("/etc/letsencrypt/live/mastercal.xyz/privkey.pem");

app.get("/bdaysync", (req, res) => {
    if (req.query.token !== process.env.BDSYNC_TOKEN)
        return res.status(403) && res.send("Invalid token");

    res.send(sync.getBirthdays());
});

sync.init().then(() => {

    // const httpsServer = https.createServer({
    //     cert: certificate,
	//     key: privateKey,
    // }, app);
    //
    // httpsServer.listen(config.PORT, () => console.log(`Running api on https://${ config.HOST }:${ config.PORT }/`));
    app.listen(config.PORT, () => console.log(`Running api on http://${ config.HOST }:${ config.PORT }/`));
});
