import {Injectable} from '@angular/core';
import {Driver, Event, EventData} from "./api.service";
import {BehaviorSubject} from "rxjs";
import {BoxplotProperties} from "../analytics/diagram/boxplot/boxplot.component";
import {Mode, ModeType} from "../analytics/sidebar/sidebar.component";
import {LocalstorageService} from "./localstorage.service";

@Injectable({
  providedIn: 'root'
})


export class DataService {

  activeSubsession: Event
  analyticsData: EventData
  private analyticsData_sre = new BehaviorSubject<EventData>(this.initBehaviourSubject_analyticsData())
  analyticsData_active = this.analyticsData_sre.asObservable()
  private boxplotProperties_src = new BehaviorSubject<BoxplotProperties>(this.initBehaviourSubject_bpprop())
  boxplotProperties = this.boxplotProperties_src.asObservable()
  private mode_src = new BehaviorSubject<Mode>(new Mode(ModeType.Boxplot))
  mode = this.mode_src.asObservable()

  constructor(private localStorage: LocalstorageService) {
    try {
      this.activeSubsession = this.localStorage.loadFromCache("activeSubsession")
      this.analyticsData = this.localStorage.loadFromCache("analyticsData")
    } catch (e) {
      this.activeSubsession = this.createEmptySubsession()
      this.analyticsData = this.createEmptyAnalyticsData()
    }
  }

  changeMode(mode: Mode) {
    this.mode_src.next(mode)
  }

  changeSubsession(subsession: EventData) {
    this.analyticsData_sre.next(subsession)
  }

  changeBpprop(bprop: BoxplotProperties) {
    this.boxplotProperties_src.next(bprop)
  }

  private createEmptyDriver() {
    let driver: Driver = {
      name: "",
      id: 0,
      finish_position: 1,
      finish_position_in_class: 1,
      result_status: "Running",
      laps_completed: 10,
      laps: new Array<number>(10),
      car_class_id: 0,
      car_class_name: "0",
      bpdata: {
        median: 0,
        mean: 0,
        Q1: 0,
        Q3: 0,
        whisker_top: 0,
        whisker_bottom: 0,
        fliers_top: new Array<number>(0),
        fliers_bottom: Array<number>(0),
        laps_rndFactors: Array<number>(0)
      }
    }
    return driver;
  }

  private initBehaviourSubject_bpprop() {
    try {
      return this.localStorage.loadFromCache<any>("bpprop")
    } catch (e) {
      return this.loadDefaultBpprop()
    }
  }

  private loadDefaultBpprop() {
    let bpprop = BoxplotProperties.getInstance()
    bpprop.userDriver = this.createEmptyDriver()
    bpprop.userDriver.name = "Florian Niedermeier2"
    return bpprop
  }

  private initBehaviourSubject_analyticsData() {
    try {
      return this.localStorage.loadFromCache<any>("analyticsData")
    } catch (e) {
      return this.createEmptyAnalyticsData()
    }
  }

  createEmptySubsession() {

    const subsession_null: Event = {
      subsession_id: null,
      sof: null,
      finish_position: null,
      series_name: null,
      track_name: null,
      winner_name: null,
      start_position: null,
      session_start_time: "",
    };

    return subsession_null
  }

  createEmptyAnalyticsData() {

    let driver = this.createEmptyDriver();

    let analyticsData_null: EventData = {
      metadata: {
        subsession_id: 0,
        laps_completed: 0,
        timeframe: [70, 110],
        median: 90,
        carclasses: [0]
      },
      drivers: new Array<Driver>(12)
    }

    for (let i = 0; i < analyticsData_null.drivers.length; i++) {
      analyticsData_null.drivers[i] = {...driver, finish_position: i+1, finish_position_in_class: i+1
      }
    }

    return analyticsData_null
  }
}
