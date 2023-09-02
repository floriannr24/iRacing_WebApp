import requests


class Driver:

    def __init__(self, display_name, session):
        self.display_name = display_name
        self.licenses = None
        self.cust_id = None
        self.requestDriver(session)

    def requestDriver(self, session):
        response = session.get('https://members-ng.iracing.com/data/lookup/drivers', params={"search_term": self.display_name})
        response = response.json()
        response = requests.get(response["link"])
        response = response.json()[0]

        self.cust_id = response["cust_id"]
        self.licenses = response["licenses"]
