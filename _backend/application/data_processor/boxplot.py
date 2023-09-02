
import statistics

import numpy as np

from application.data.laps_multi import LapsMulti
from application.data.results_multi import ResultsMulti


class Boxplot:
    def __init__(self, session):
        self.subsession_id = None
        self.session = session
        self.iRacing_lapdata = None
        self.iRacing_results = None

    def get_Boxplot_Data(self, subsession_id):

        self.subsession_id = subsession_id

        # get session application.data from iRacingAPI
        self.iRacing_lapdata = LapsMulti().requestLapsMulti(self.subsession_id, self.session)
        self.iRacing_results = ResultsMulti().requestResultsMulti(self.subsession_id, self.session)

        unique_drivers = self.findUniqueDrivers(self.iRacing_lapdata)

        dictionary = {
            "metadata": {
                "subsession_id": self.subsession_id,
                "laps_completed": [],
                "timeframe": [],
                "median": None,
                "carclasses": self.findCarclasses(self.iRacing_results)
            },
            "drivers": []
        }

        for driver in unique_drivers:
            output = self.collectInfo(driver)
            output = self.deleteInvalidLaptimes(output)
            output = self.caclulateStatistics(output)
            dictionary = self.addToDictionary(dictionary, output)

        dictionary = self.caclulateTimeframe(dictionary)
        dictionary = self.calculateMedian(dictionary)
        dictionary = self.sortDictionary(dictionary)
        dictionary = self.removePositionsForDiscDisq(dictionary)

        return dictionary

    def searchUsersCarClass(self, id):

        carclassid = None

        for results in self.iRacing_results["session_results"][2]["results"]:
            if results["cust_id"] == id:
                carclassid = results["car_class_id"]
                break
            else:
                continue
        return carclassid

    def sortDictionary(self, dictionary):
        secondarySort = list(sorted(dictionary["drivers"],
                                    key=lambda p: p["finish_position"]))  # secondary sort by key "finish_position"

        primarySort = list(sorted(secondarySort, key=lambda p: p["laps_completed"],
                                  reverse=True))  # primary sort by key "laps_completed", descending

        dictionary["drivers"] = primarySort

        return dictionary

    def filterByCarClass(self, carclass_id):
        iRacing_results = []
        iRacing_lapdata = []

        for results in self.iRacing_results["session_results"][2]["results"]:
            if results["car_class_id"] == carclass_id:
                iRacing_results.append(results["cust_id"])

        for driver in iRacing_results:
            for lapdata in self.iRacing_lapdata:
                if driver == lapdata["cust_id"]:
                    iRacing_lapdata.append(lapdata)

        return iRacing_lapdata

    def findUniqueDrivers(self, iRacing_lapdata_carclass):
        unique_drivers = set()
        for item in iRacing_lapdata_carclass:
            unique_drivers.add((item["cust_id"], item["display_name"]))
        return unique_drivers

    def convertTimeformatToSeconds(self, laptime):
        if not laptime == -1:
            return laptime / 10000
        else:
            return None

    def scanForInvalidTypes(self, laptimes, arg1, arg2):
        return [laptime for laptime in laptimes if laptime != arg1 if laptime != arg2]

    def collectInfo(self, driver):

        driver_id = driver[0]
        driver_name = driver[1]

        list_of_positions = self.list_of_positions(driver_id)

        intDict = {
            "name": driver_name,
            "id": driver_id,
            "finish_position": self.set_finishPosition(list_of_positions),
            "finish_position_in_class": self.set_finishPositionInClass(driver_id),
            "result_status": self.set_resultStatus(driver_id),
            "laps_completed": self.set_lapsCompleted(list_of_positions),
            "laps": self.set_laps(driver_id),
            "car_class_id": self.set_carClass(driver_id)["id"],
            "car_class_name": self.set_carClass(driver_id)["name"]
        }

        return intDict

    def list_of_positions(self, driver_id):
        laps_completed_pos = []
        for record in self.iRacing_lapdata:
            if record["cust_id"] == driver_id:
                laps_completed_pos.append(record["lap_position"])
        return laps_completed_pos

    def set_lapsCompleted(self, laps_completed_pos):
        return len(laps_completed_pos) - 1

    def set_finishPosition(self, laps_completed_pos):
        return laps_completed_pos[self.set_lapsCompleted(laps_completed_pos)]

    def set_resultStatus(self, driver_id):
        for data in self.iRacing_results["session_results"][2]["results"]:
            if driver_id == data["cust_id"]:
                return data["reason_out"]


    def extractLaptimes(self, all_laptimes, raceCompleted):

        numberOfDrivers = len(all_laptimes)
        drivers_raw = []

        if raceCompleted:
            laps = []
            for lapdata in all_laptimes:
                if lapdata["result_status"] == "Running":
                    laps.append(lapdata["laps"])
                    drivers_raw.append(lapdata["driver"])
                else:
                    continue
            return laps
        else:
            laps = []
            for lapdata in all_laptimes:
                if lapdata["result_status"] == "Disqualified" or lapdata["result_status"] == "Disconnected":
                    laps.append(lapdata["laps"])
                    drivers_raw.append(lapdata["driver"])
                else:
                    continue

            # fill up indices, so DISQ and DISC drivers are put to the last places in the diagram
            indicesToFillUp = numberOfDrivers - len(laps)
            for i in range(indicesToFillUp):
                laps.insert(0, "")
            return laps

    def set_laps(self, driver_id):

        session_time0 = 0
        laps = []

        for i, record in enumerate(self.iRacing_lapdata):

            if record["cust_id"] == driver_id:

                lap_number = record["lap_number"]
                session_time1 = record["session_time"]

                if lap_number == 0:
                    session_time0 = record["session_time"]

                if lap_number > 0:
                    lap_time = session_time1 - session_time0
                    session_time0 = session_time1
                    lap_time = self.convertTimeformatToSeconds(lap_time)
                    laps.append(lap_time)

        return laps

    def deleteInvalidLaptimes(self, output):
        output["laps"] = [value for value in output["laps"] if value != -1 if value is not None]
        return output

    def caclulateStatistics(self, output):

        output["bpdata"] = {
            "median": None,
            "mean": None,
            "Q1": None,
            "Q3": None,
            "whisker_top": None,
            "whisker_bottom": None,
            "fliers_top": None,
            "fliers_bottom": None,
            "laps_rndFactors": None
        }

        if output["laps"]:
            output["bpdata"]["median"] = statistics.median(output["laps"])
            output["bpdata"]["mean"] = statistics.mean(output["laps"])
            output["bpdata"]["Q1"] = Q1 = np.quantile(output["laps"], 0.25)
            output["bpdata"]["Q3"] = Q3 = np.quantile(output["laps"], 0.75)
            output["bpdata"]["whisker_top"] = whisker_top = self.calc_whiskerTop(Q1, Q3, output["laps"])
            output["bpdata"]["whisker_bottom"] = whisker_bottom = self.calc_whiskerBottom(Q1, Q3, output["laps"])
            output["bpdata"]["fliers_top"] = fliers_top = self.calc_fliersTop(whisker_top, output["laps"])
            output["bpdata"]["fliers_bottom"] = fliers_bottom = self.calc_fliersBottom(whisker_bottom, output["laps"])
            output["bpdata"]["laps_rndFactors"] = self.calc_lapsRndmFactors(fliers_top, fliers_bottom, output["laps"])

        return output

    def addToDictionary(self, dictionary, output):
        dictionary["drivers"].append(output)
        return dictionary

    def caclulateTimeframe(self, dictionary):

        tempMax = []
        tempMin = []

        for driver in dictionary["drivers"]:
            if driver["laps"]:
                tempMax.append(max(driver["laps"]))
                tempMin.append(min(driver["laps"]))

        slowestLap = max(tempMax)
        fastestLap = min(tempMin)

        dictionary["metadata"]["timeframe"] = [fastestLap, slowestLap]

        return dictionary

    def calc_fliersTop(self, whisker_top, laps):

        laps = sorted(laps)

        if whisker_top:
            candidates = [item for item in laps if item > whisker_top]
            return candidates
        else:
            return []

    def calc_fliersBottom(self, whisker_bottom, laps):

        laps = sorted(laps, reverse=True)

        if whisker_bottom:
            candidates = [item for item in laps if item < whisker_bottom]
            return candidates
        else:
            return []

    def calc_whiskerTop(self, Q1, Q3, laps):

        IQR15 = (Q3 - Q1) * 1.5
        whiskerTop = Q3 + IQR15

        laps = sorted(laps)

        candidates = [item for item in laps if item < whiskerTop if item > Q3]

        if not candidates:
            return Q3
        else:
            return max(candidates)

    def calc_whiskerBottom(self, Q1, Q3, laps):

        IQR15 = (Q3 - Q1) * 1.5
        whiskerBottom = Q1 - IQR15

        laps = sorted(laps, reverse=True)

        candidates = [item for item in laps if item > whiskerBottom if item < Q1]

        if not candidates:
            return Q1
        else:
            return min(candidates)

    def calculateMedian(self, dictionary):

        laps = []

        for driver in dictionary["drivers"]:

            for lap in driver["laps"]:
                laps.append(lap)

        dictionary["metadata"]["median"] = statistics.median(laps)

        return dictionary

    def calc_lapsRndmFactors(self, fliers_top, fliers_bottom, laps):

        randoms = np.random.normal(0, 1, len(laps)).tolist()
        excludedIndex = [i for i, x in enumerate(laps) if x in fliers_top or x in fliers_bottom]

        for i in excludedIndex:
            randoms[i] = 0

        return randoms

    def removePositionsForDiscDisq(self, dictionary):

        for driver in dictionary["drivers"]:
            if driver["result_status"] == "Disconnected":
                driver["finish_position"] = 'DISC'
                driver["finish_position_in_class"] = 'DISC'
            if driver["result_status"] == "Disqualified":
                driver["finish_position"] = 'DISQ'
                driver["finish_position_in_class"] = 'DISQ'

        return dictionary

    def set_carClass(self, driver_id):

        carClass = {}

        for data in self.iRacing_results["session_results"][2]["results"]:
            if data["cust_id"] == driver_id:
                carClass["id"] = data["car_class_id"]
                carClass["name"] = data["car_class_name"]
                break

        return carClass

    def set_finishPositionInClass(self, driver_id):
        for data in self.iRacing_results["session_results"][2]["results"]:
            if data["cust_id"] == driver_id:
                return data["finish_position_in_class"] + 1

    def findCarclasses(self, iRacing_results):
        unique_cc = set()
        for item in iRacing_results["session_results"][2]["results"]:
            unique_cc.add(item["car_class_id"])
        unique_cc_list = list(unique_cc)
        unique_cc_list.sort()

        return unique_cc_list
