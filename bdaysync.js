import { loadSavedCredentialsIfExist } from "./utils/loadSavedCredentialsIfExist";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { saveCredentials } from "./utils/saveCredentials";
import * as path from "path";

const defaultCalendarPath = path.join(process.cwd(), "bdcal.ics");
const defaultCredentialsPath = path.join(process.cwd(), "credentials.json");
const defaultTokenPath = path.join(process.cwd(), "token.json");


const SCOPES = [ 'https://www.googleapis.com/auth/contacts.readonly' ];


class BDaySync {
    constructor(calendarPath, credentialsPath, tokenPath) {
        /**
         * Reminder: all paths must be absolute!
         */

        this.calendarPath = calendarPath || defaultCalendarPath;
        this.credentialsPath = credentialsPath || defaultCredentialsPath;
        this.tokenPath = tokenPath || defaultCredentialsPath;
    }

    async init() {
        this.client = loadSavedCredentialsIfExist(this.credentialsPath);

        if (this.client == null) {
            this.client = await authenticate({
                scopes: SCOPES,
                keyfilePath: this.credentialsPath
            });

            if (this.client.credentials)
                saveCredentials(this);
        }

        this.service = google.people({ version: "v1", auth: this.client });
    }

    async listContacts() {
        const res = await this.service.people.connections.list({
            resourceName: "people/me",
            pageSize: 2000,
            personFields: "names,birthdays"
        });

        return res.data.connections;
    }
}

export { BDaySync };
