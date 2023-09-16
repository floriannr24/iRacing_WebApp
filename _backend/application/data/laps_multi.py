import requests

class LapsMulti:

    def requestLapsMulti(self, subsession, session):

        # iRacingAPI
        data = session.get('https://members-ng.iracing.com/data/results/lap_chart_data',
                                params={"subsession_id": subsession, "simsession_number": "0"})

        data = data.json()
        data = requests.get(data["link"]).json()

        base_download_url = data["chunk_info"]["base_download_url"]
        chunk_file_names = data["chunk_info"]["chunk_file_names"]

        iRacingData = []

        for data in chunk_file_names:
            intList = requests.get(base_download_url + data).json()
            iRacingData = iRacingData + intList

        return iRacingData

