const fs = require("fs");
const { google } = require("googleapis");

module.exports = (credentialsPath) => {
    try {
        const content = fs.readFileSync(credentialsPath, { encoding: "utf8" });
        const parsedCredentials = JSON.parse(content);
        return google.auth.fromJSON(parsedCredentials);
    } catch (err) {
        console.error(`Err: ${err}`);
        return null;
    }
}
