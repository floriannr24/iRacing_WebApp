import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, Subscription} from "rxjs";
import {DataService} from "./data.service";
import {Account} from "../settings/settings.component";

@Injectable({
  providedIn: 'root'
})

export class APIService {
  private custidSubscription: Subscription
  private custId: number

  constructor(private http: HttpClient, private dataService: DataService) {
    this.custidSubscription = this.dataService.mainAcc.subscribe(acc => {
      if (acc != undefined) {
        this.custId = acc.custId
      }

    })
  }

  ngOnDestroy() {
    this.custidSubscription.unsubscribe()
  }

  public getAccountInfo(id: number) {
    try {
      return this.http.get<string>("http://localhost:8000/accountInfo/"+id)
    } catch (e) {
      throw new Error("Unable to fetch info from iRacing server")
    }
  }

  public getRecentRaces(): Observable<Event[]> {
    try {
      return this.http.get<Event[]>("http://localhost:8000/data/recentRaces/"+this.custId)
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


export class Event {
  session_start_time: string = ""
  series_name: string = ""
  start_position: number = 0
  finish_position: number = 0
  winner_name: string = ""
  sof: number = 0
  subsession_id: number | null = 0
  track_name: string = ""
}

export class Driver {

  constructor() {
  }

  name: string | null = ""
  id: number = 0
  finish_position: number | string = 1
  finish_position_in_class: number | string = 1
  result_status: string = "Running"
  laps_completed: number = 10
  laps: number[] = new Array<number>(10)
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
  fliers_top: number[] = new Array<number>(0)
  fliers_bottom: number[] = new Array<number>(0)
  laps_rndFactors: number[] = new Array<number>(0)
}

export class EventData {

  metadata: Metadata
  drivers: Driver[] = new Array<Driver>(12)

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
    timeframe: number[],
    median: number
    carclasses: number[]
}









