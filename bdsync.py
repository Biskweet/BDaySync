"""
Part of this code was taken from Google's documentation
    - https://developers.google.com/people/quickstart/python
"""
import datetime
import os
import threading
import time

import icalendar
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient import discovery as googlediscovery
import dotenv


dotenv.load_dotenv()

DB_UPDATE_DELAY = int(os.environ["DB_UPDATE_DELAY"])
SCOPES = ["https://www.googleapis.com/auth/contacts.readonly"]


class BDSync:
    @staticmethod
    def contact_to_event(contact):
        person_name = ''
        given_name = contact["names"][0].get("givenName")
        family_name = contact["names"][0].get("familyName")
        if given_name:
            person_name = given_name
        if family_name:
            if person_name:
                person_name += ' '
            person_name += family_name

        event_birthday = icalendar.Event()

        # Setting SUMMARY
        event_birthday["summary"] = f"Birthday: {person_name}"

        # Setting DTSTART
        year = contact["birthdays"][0]["date"].get("year", "1970")
        month = contact["birthdays"][0]["date"].get("month")
        day = contact["birthdays"][0]["date"].get("day")
        event_birthday["dtstart"] = f'{year}{month:02d}{day:02d}'

        # Setting RRULE
        event_birthday.add("rrule", {
            "freq": "yearly",
            "bymonth": contact["birthdays"][0]["date"]["month"],
            "bymonthday": contact["birthdays"][0]["date"]["day"]
        })

        return event_birthday

    def __init__(self, credentials_path="credentials.json", token_path="token.json", calendar_path="bdays.ical"):
        self.creds = None
        self.refresh_token(credentials_path, token_path)
        self.service = self.get_service()
        self.calendar_path = calendar_path

        if not os.path.exists(self.calendar_path):
            self.refresh_database()

        threading.Timer(DB_UPDATE_DELAY, self.refresh_database).start()

    def refresh_database(self):
        cal = self.contacts_to_cal()
        cal_str = cal.to_ical().decode("utf8").replace("\r\n", "\n")

        with open(self.calendar_path, "w", encoding="utf8") as f:
            f.write(cal_str)

        threading.Timer(DB_UPDATE_DELAY, self.refresh_database).start()

    def refresh_token(self, credentials_path, token_path):
        self.creds = None

        if os.path.exists(token_path):
            self.creds = Credentials.from_authorized_user_file(token_path, SCOPES)

        # No valid token: either refesh it or get a new one
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())

            else:
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        credentials_path,
                        SCOPES
                    )

                    self.creds = flow.run_local_server(port=0)

                except Exception as e:
                    print("Exception occured:", e)
                    exit(1)

            with open(token_path, "w") as file:
                file.write(self.creds.to_json())

    def get_service(self):
        return googlediscovery.build(
            "people", "v1",
            credentials=self.creds
        )

    def list_contacts(self):
        res = (
            self.service.people()
            .connections()
            .list(
                resourceName="people/me",
                pageSize=2000,
                personFields="names,birthdays"
            )
            .execute()
        )

        return res["connections"]

    def contacts_to_cal(self):
        contacts_with_birthday = list(filter(
            lambda c: "birthdays" in c.keys(),
            self.list_contacts()
        ))

        calendar = icalendar.Calendar()

        for contact in contacts_with_birthday:
            event = BDSync.contact_to_event(contact)
            calendar.add_component(event)

        return calendar

    def get_birthdays(self):
        with open(self.calendar_path, "r", encoding="utf8") as f:
            content = f.read()

        return content
