const path = require('path');
const process = require('process');


import cors from "cors";
import express from "express";
import * as https from "https";
import * as fs from "fs";

import { config } from "config";
import { DatabaseIndexer } from "~~/databaseindexer";
import { BDaySyncController } from "~~/controllers/bdaysync.controller";

const app = express();
app.use(cors());

app.use("/bdaysync", MasterCalAPIController);

const certificate = fs.readFileSync("/etc/letsencrypt/live/mastercal.xyz/fullchain.pem");
const privateKey = fs.readFileSync("/etc/letsencrypt/live/mastercal.xyz/privkey.pem");

DatabaseIndexer.init().then(() => {

    const httpsServer = https.createServer({
        cert: certificate,
	    key: privateKey,
    }, app);

    httpsServer.listen(config.PORT, () => console.log(`Running api on https://${ config.HOST }:${ config.PORT }/`));
});
