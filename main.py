import os

from fastapi import FastAPI, Response
from bdsync import BDSync
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
sync = BDSync()

AUTH_TOKEN = os.environ["BDSYNC_TOKEN"]


@app.get("/")
async def root(token: str = ''):
    cal = sync.get_birthdays()

    if token != AUTH_TOKEN:
        return Response(status_code=403)

    return Response(content=cal.to_ical().decode("utf8"), media_type="text/calendar")
