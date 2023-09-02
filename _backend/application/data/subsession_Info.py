import requests


class SubsessionInfo:

    def requestSessionInfo(self, subsession, session):

        # iRacingAPI
        data = session.get('https://members-ng.iracing.com/data/results/lap_chart_data',
                           params={"subsession_id": subsession, "simsession_number": "0"})
        data = data.json()
        data = requests.get(data["link"]).json()

        return data["session_info"]
