import requests
from aiohttp import ClientSession

class ResultsMulti:

    def requestResultsMulti(self, subsession, session):

        # iRacingAPI
        iRacingData = session.get('https://members-ng.iracing.com/data/results/get',
                                       params={"subsession_id": subsession, "simsession_number": "0"})

        iRacingData = requests.get(iRacingData.json()["link"]).json()

        intDict = {}

        intDict["series_name"] = iRacingData["series_name"]
        intDict["track"] = iRacingData["track"]
        intDict["weather"] = iRacingData["weather"]
        intDict["session_results"] = iRacingData["session_results"]

        iRacingData = intDict

        return iRacingData



