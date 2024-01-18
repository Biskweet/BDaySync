import os

from fastapi import FastAPI, Response
from dotenv import load_dotenv
from uvicorn import config as uvicornconf

from bdsync import BDSync

load_dotenv()

app = FastAPI()
sync = BDSync()

AUTH_TOKEN = os.environ["BDSYNC_TOKEN"]
uvicornconf.LOGGING_CONFIG["formatters"]["default"]["fmt"] = "%(asctime)s [%(name)s] %(levelprefix)s %(message)s"

@app.get("/bdaysync")
async def root(token: str = ''):
    cal = sync.get_birthdays()

    if token != AUTH_TOKEN:
        return Response(status_code=403)

    return Response(content=cal)