"""
Part of this code was taken from Google's documentation
	- https://developers.google.com/people/quickstart/python
"""

import os

import icalendar
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient import discovery as googlediscovery
from googleapiclient.errors import HttpError

SCOPES = [ "https://www.googleapis.com/auth/contacts.readonly" ]


class BDSync:
	def __init__(self, credentials_path="credentials.json", token_path="token.json"):
		self.refresh_token(credentials_path, token_path)
		self.service = self.get_service()

	def refresh_token(self, credentials_path, token_path):
		self.creds = None

		if os.path.exists(token_path):
			self.creds = Credentials.from_authorized_user_file(token_path, SCOPES)

		# No valid token: either refesh it or get a new one
		elif self.creds is None or self.creds.valid:
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
				personFields="names,birthdays"
			)
			.execute()
		)

		return list(filter(
			lambda contact: "birthdays" in contact.keys(),
			res["connections"]
		))

	def contacts_to_cal(self):
		contacts = self.list_contacts()

		calendar = icalendar.Calendar()

		for contact in contacts:
			person_name = contact["names"][0]["givenName"] + ' ' + contact["names"][0]["familyName"]
			person




