import * as fs from "fs";
import { google } from "googleapis";

const loadSavedCredentialsIfExist = (credentialsPath) => {
    try {
        const content = fs.readFileSync(credentialsPath, { encoding: "utf8" });
        const parsedCredentials = JSON.parse(content);
        return google.auth.fromJSON(parsedCredentials);
    } catch (err) {
        return null;
    }
}

export { loadSavedCredentialsIfExist };
