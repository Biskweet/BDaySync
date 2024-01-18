const { loadSavedCredentialsIfExist } = require("./utils/loadSavedCredentialsIfExist");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const { saveCredentials } = require("./utils/saveCredentials");
const path = require("path");
const fs = require("fs");
const { config } = require("./config");

const ICAL = require("ical.js");


const defaultCalendarPath = path.join(process.cwd(), "bdcal.ics");
const defaultCredentialsPath = path.join(process.cwd(), "credentials.json");
const defaultTokenPath = path.join(process.cwd(), "token.json");

const SCOPES = [ 'https://www.googleapis.com/auth/contacts.readonly' ];


class BDaySync {
    static contactToEvent(contact) {
        let name = '';
        const givenName = contact.names[0].givenName;
        const familyName = contact.names[0].familyName;
        if (givenName)
            name = givenName;
        if (familyName) {
            if (name.length > 0)
                name += ' '
            name += familyName;
        }

        let event = new ICAL.Component("vevent");

        event.addPropertyWithValue("summary", `Birthday: ${name}`);

        event.addPropertyWithValue("dtstart", new ICAL.Time({
            year: contact.birthdays[0].date.year || 1970,
            month: contact.birthdays[0].date.month,
            day: contact.birthdays[0].date.day
        }));

        event.addPropertyWithValue("rrule", new ICAL.Recur({
            freq: "yearly",
            bymonth: contact.birthdays[0].date.month,
            bymonthday: contact.birthdays[0].date.day
        }));

        return event;
    }

    constructor(calendarPath, credentialsPath, tokenPath) {
        /**
         * Reminder: all paths must be absolute!
         */

        this.calendarPath = calendarPath || defaultCalendarPath;
        this.credentialsPath = credentialsPath || defaultCredentialsPath;
        this.tokenPath = tokenPath || defaultTokenPath;
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

        if (fs.existsSync(this.calendarPath) === false)
            this.refreshDatabase();

        setInterval(this.refreshDatabase, config.databaseUpdateDelay);
    }

    refreshDatabase() {
        this.contactsToCal().then((calendar) => {
            const calStr = calendar.toString();

            fs.writeFileSync(this.calendarPath, calStr, { encoding: "utf8" });
        });
    }

    async listContacts() {
        const res = await this.service.people.connections.list({
            resourceName: "people/me",
            pageSize: 2000,
            personFields: "names,birthdays"
        });

        return res.data.connections;
    }

    async contactsToCal() {
        const contacts = await this.listContacts();
        const contactsWithBirthday = contacts.filter(contact => contact.birthdays !== undefined);

        const calendar = new ICAL.Component("vcalendar");
        contactsWithBirthday.forEach((contact) => {
            const birthday = BDaySync.contactToEvent(contact);
            calendar.addSubcomponent(birthday);
        });

        return calendar;
    }

    getBirthdays() {
        return fs.readFileSync(this.calendarPath, { encoding: "utf8" });
    }
}

module.exports = BDaySync;
