import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})

export class APIService {

  constructor(private http: HttpClient) {
  }

  public getRecentRaces(): Observable<Event[]> {
    try {
      return this.http.get<Event[]>("http://localhost:8000/data/recentRaces/817320")
    } catch (e) {
      throw new Error("Unable to fetch latest races from iRacing server")
    }
  }

  public getBoxplotData(subsession: number): Observable<EventData> {
    try {
      return this.http.get<EventData>("http://localhost:8000/data/boxplot/" + subsession)
    } catch (e) {
      throw new Error("Unable to fetch subsession data from iRacing server")
    }
  }

  public getSubsessionInfo(subsession: number): Observable<Event> {
    try {
      return this.http.get<Event>("http://localhost:8000/data/subsessionInfo/" + subsession)
    } catch (e) {
      throw new Error("Unable to fetch subsession info from iRacing server")
    }
  }
}


export interface EventData {
  metadata: {
    subsession_id: number,
    laps_completed: number,
    timeframe: Array<number>,
    median: number,
    carclasses: Array<number>
  },
  drivers: Array<Driver>
}

export class Event {
  session_start_time: string = ""
  series_name: string | null = null
  start_position: number | null = null
  finish_position: number | null = null
  winner_name: string | null = null
  sof: number | null = null
  subsession_id: number | null = null
  track_name: string | null = null
}

export class Driver {

  name: string | null = ""
  id: number = 0
  finish_position: number | string = 1
  finish_position_in_class: number | string = 1
  result_status: string = "Running"
  laps_completed: number = 10
  laps: Array<number> = new Array<number>(10)
  car_class_id: number = 0
  car_class_name: string = ""
  bpdata: BoxplotData = new BoxplotData()
}

export class BoxplotData {
  median: number = 0
  mean: number = 0
  Q1: number = 0
  Q3: number = 0
  whisker_top: number = 0
  whisker_bottom: number = 0
  fliers_top: Array<number> = new Array<number>(0)
  fliers_bottom: Array<number> = new Array<number>(0)
  laps_rndFactors: Array<number> = new Array<number>(0)
}

export class EventData {

  metadata: Metadata
  drivers: Array<Driver> = new Array<Driver>(12)

  constructor() {
    this.metadata = {
      subsession_id: 0,
      laps_completed: 0,
      timeframe: [70,110],
      median: 90,
      carclasses: [0]
    }
  }
}

export interface Metadata {
    subsession_id: number,
    laps_completed: number,
    timeframe: Array<number>,
    median: number
    carclasses: Array<number>
}









