from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from _backend.application.data.driver import Driver
from _backend.application.data.recent_races import RecentRaces
from _backend.application.data_processor.boxplot import Boxplot
from _backend.application.data_processor.sessionInfo import SessionInfo
from _backend.application.sessionbuilder.session_builder import SessionBuilder

app = FastAPI()

origins = [
    "http://localhost:4200",
]

sessionBuilder = SessionBuilder()
sessionBuilder.authenticate()
session = sessionBuilder.session

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/data/recentRaces/{cust_id}")
def getRecentRaces(cust_id: int):
    return RecentRaces(session).get_RecentRaces(cust_id)


@app.get("/data/boxplot/{subsession_id}")
def getBoxplotData(subsession_id: int):
    return Boxplot(session).get_Boxplot_Data(subsession_id)


@app.get("/data/subsessionInfo/{subsession_id}")
def getSubsessionInfo(subsession_id: int):
    return SessionInfo(session).get_SessionInfo_Data(subsession_id)

@app.get("/accountInfo/{cust_id}")
def getAccountInfo(cust_id: int):
    return Driver(session).get_AccountInfo(cust_id)

getAccountInfo(817320)
