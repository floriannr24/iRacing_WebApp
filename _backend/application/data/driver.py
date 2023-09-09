import requests


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

        print(response)

        self.cust_id = response["cust_id"]
        self.licenses = response["licenses"]

    def get_AccountInfo(self, cust_id):
        response = self.session.get('https://members-ng.iracing.com/data/member/get', params={"cust_ids": cust_id})
        response = response.json()
        response = requests.get(response["link"])
        response = response.json()
        return response["members"][0]["display_name"]

