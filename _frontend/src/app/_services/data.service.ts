import {Injectable} from '@angular/core';
import {Driver, Event, EventData} from "./api.service";
import {BehaviorSubject} from "rxjs";
import {BoxplotProperties} from "../analytics/diagram/boxplot/boxplot.component";
import {Mode, ModeType} from "../analytics/sidebar/sidebar.component";
import {LocalStorageItem, LocalstorageService} from "./localstorage.service";
import {Account, Accounts} from "../settings/settings.component";

@Injectable({
  providedIn: 'root'
})

export class DataService {

  subsessionInfo: Event
  private mainAcc_src = new BehaviorSubject<Account>(this.initMainAcc())
  mainAcc = this.mainAcc_src.asObservable()
  private analyticsData_sre = new BehaviorSubject<EventData>(this.init_analyticsData())
  analyticsData = this.analyticsData_sre.asObservable()
  private boxplotProperties_src = new BehaviorSubject<BoxplotProperties>(this.init_bpprop())
  boxplotProperties = this.boxplotProperties_src.asObservable()
  private mode_src = new BehaviorSubject<Mode>(new Mode(ModeType.Boxplot))
  mode = this.mode_src.asObservable()


  constructor(private localStorage: LocalstorageService) {
    try {
      this.subsessionInfo = this.localStorage.load(LocalStorageItem.subsessionInfo)
    } catch (e) {
      this.subsessionInfo = new Event()
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

  changeMainAcc(acc: Account) {
    this.mainAcc_src.next(acc)
  }

  private init_bpprop() {
    try {
      return this.localStorage.load<any>("bpprop")
    } catch (e) {
      return this.loadDefaultBpprop()
    }
  }

  private loadDefaultBpprop() {
    let bpprop = BoxplotProperties.getInstance()
    bpprop.userDriver = new Driver()
    bpprop.userDriver.name = ""
    return bpprop
  }

  private init_analyticsData() {
    try {
      return this.localStorage.load<any>("analyticsData")
    } catch (e) {
      return this.createEmptyAnalyticsData()
    }
  }

  createEmptyAnalyticsData() {

    let driver = new Driver();

    let analyticsData = new EventData()

    for (let i = 0; i < analyticsData.drivers.length; i++) {
      analyticsData.drivers[i] = {...driver, finish_position: i+1, finish_position_in_class: i+1
      }
    }

    return analyticsData
  }

  private initMainAcc(): Account {

    let acc: Account = {
      custId: 0,
      name: ""
    }

    try {
      let accSaved = this.localStorage.load<Accounts>(LocalStorageItem.accountData)
      if (accSaved.main.length == 0) {
        return accSaved.main[0]
      } else {
        return acc
      }
    } catch (e) {
      return acc
    }
  }
}
