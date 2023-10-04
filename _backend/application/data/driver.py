import requests

from _backend.application.sessionbuilder.session_builder import responseIsValid


class Driver:

    def __init__(self, session):
        self.session = session
        self.licenses = None
        self.cust_id = None

    def requestDriver(self, session):
        response = session.get('https://members-ng.iracing.com/data/lookup/drivers', params={})
        response = response.json()
        response = requests.get(response["link"])
        response = response.json()[0]

        self.cust_id = response["cust_id"]
        self.licenses = response["licenses"]

    def get_AccountInfo(self, cust_id):
        response = self.session.get('https://members-ng.iracing.com/data/member/get', params={"cust_ids": cust_id}).json()
        responseLink = self.session.get(response["link"])
        data = responseLink.json()
        return data["members"][0]["display_name"]

