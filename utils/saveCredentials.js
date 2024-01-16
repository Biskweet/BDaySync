import * as fs from "fs";


const saveCredentials = (syncer) => {
    const content = fs.readFileSync(syncer.credentialsPath, { encoding: "utf8" });
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    const payload = JSON.stringify({
        type: "authorized_user",
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: syncer.refreshToken,
    });

    fs.writeFileSync(syncer.tokenPath, payload);
}

export { saveCredentials };
