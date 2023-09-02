
import requests


class RecentRaces:

    def __init__(self, session):
        self.session = session

    def get_RecentRaces(self, cust_id):

        data = self.requestRecentRaces(cust_id)

        exportDict = []

        for element in data:
            intdict = {
                "session_start_time": element["session_start_time"],
                "series_name": element["series_name"],
                "start_position": element["start_position"],
                "finish_position": element["finish_position"],
                "winner_name": element["winner_name"],
                "sof": element["strength_of_field"],
                "subsession_id": element["subsession_id"],
                "track_name": element["track"]["track_name"]
            }

            exportDict.append(intdict)

        return exportDict

    def requestRecentRaces(self, cust_id):

        # iRacingAPI
        data = self.session.get('https://members-ng.iracing.com/data/stats/member_recent_races',
                                params={'cust_id': cust_id})
        data = data.json()
        data = requests.get(data["link"]).json()
        data = data["races"]

        return data

    # def get_finish_position(self, subsession_id, cust_id):
    #
    #     iRacing_results = ResultsMulti().requestResultsMulti(subsession_id, self.session)
    #
    #     for data in iRacing_results["session_results"][2]["results"]:
    #         if data["cust_id"] == cust_id:
    #             if data['reason_out'] == 'Running':
    #                 return data["finish_position"] + 1
    #             if data['reason_out'] == "Disconnected":
    #                 return 'DISC'
    #             if data['reason_out'] == "Disqualified":
    #                 return 'DISQ'
