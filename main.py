from fastapi import FastAPI, Response
from bdsync import BDSync

app = FastAPI()
syncer = BDSync()



@app.get("/")
async def root():
    res = "test"
    return Response(content=res)#, media_type="text/calendar")
