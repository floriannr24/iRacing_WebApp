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

export interface Event {
  session_start_time: string,
  series_name: string | null,
  start_position: number | null,
  finish_position: number | null,
  winner_name: string | null,
  sof: number | null,
  subsession_id: number | null,
  track_name: string | null,
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

export interface Driver {
  name: string | null,
  id: number
  finish_position: number | string
  finish_position_in_class: number | string
  result_status: string,
  laps_completed: number,
  laps: Array<number>
  car_class_id: number
  car_class_name: string
  bpdata: {
    median: number
    mean: number
    Q1: number
    Q3: number
    whisker_top: number
    whisker_bottom: number
    fliers_top: Array<number>
    fliers_bottom: Array<number>
    laps_rndFactors: Array<number>
  }
}






