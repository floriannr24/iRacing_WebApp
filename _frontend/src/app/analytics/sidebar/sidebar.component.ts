import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../../_services/data.service";
import {BoxplotProperties, OptionsBoxplot} from "../diagram/boxplot/boxplot.component";
import {map, Observable, Subject, takeUntil} from "rxjs";
import {LocalStorageItem, LocalstorageService} from "../../_services/localstorage.service";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {

  @ViewChild('errorTag') errorTag: ElementRef<HTMLDivElement>
  stop$ = new Subject<void>()
  bpprop: BoxplotProperties
  options!: OptionsBoxplot
  showError: boolean = false
  errorTag_text: string
  _showMenu: boolean = false
  _showSettings: boolean = false
  _showSub: boolean = true
  modes: Mode[] = [
    new Mode(ModeType.Boxplot),
    new Mode(ModeType.Delta),
    new Mode(ModeType.Positions)
  ]
  selectedMode: Mode
  laps: Observable<number>;

  constructor(public dataService: DataService, private localstorageService: LocalstorageService) {
  }

  ngOnInit() {
    try {
      this.bpprop = this.localstorageService.load("")
    } catch (e) {
      this.bpprop = BoxplotProperties.getInstance()
    }
    this.options = this.initOptions()
    this.dataService.mode.pipe(takeUntil(this.stop$)).subscribe(mode => this.selectedMode = mode)
    this.laps = this.dataService.analyticsData.pipe(map(aD => aD.metadata.laps))
    this.loadOptionsFromBprop()
  }

  ngOnDestroy() {
    this.stop$.next()
    this.stop$.complete()
  }

  showMenu() {
    this._showMenu = !this._showMenu
  }

  onOptionsChange(master: string, value: boolean, type: string) {
    if (type === "opt_bp") {
      this.setProperties(master, value)
      this.localstorageService.save(LocalStorageItem.bpprop, this.bpprop)
      this.dataService.changeBpprop(this.bpprop)
    }
  }

  onSubOptionsChange(master: string, sub: string, value: boolean, type: string) {
    if (type === "opt_bp") {
      this.setSubProperties(master, sub, value)
      this.localstorageService.save(LocalStorageItem.bpprop, this.bpprop)
      this.dataService.changeBpprop(this.bpprop)
    }
  }

  private setProperties(firstKey: string, value: boolean) {
    for (const [k, v] of Object.entries(this.bpprop.options)) {
      if (firstKey === k) {
        v.checked = value
      }
    }
  }

  private setSubProperties(firstKey:  string, secondKey: string, value: boolean) {

    for (const [k1,v1] of Object.entries(this.bpprop.options)) {
      if (firstKey === k1) {
        for (const [k2,v2] of Object.entries(v1.suboptions!)) {
          if (secondKey === k2) {
            v2.checked = value
          }
        }
      }
    }
  }

  private loadOptionsFromBprop() {
  //   for (const [key, value] of Object.entries(this.options)) {
  //   }
  //
  //   for (let optKey in this.options) {
  //     for (let bpropKey in this.bpprop.options) {
  //       if (optKey === bpropKey) {
  //         this.options[optKey].checked = this.bpprop.options[bpropKey].checked
  //       }
  //     }
  //   }
  }

  private initOptions() {
    return this.bpprop.options
  }

  showDiagramSettings() {
    this._showSettings = !this._showSettings
  }

  selectMode(mode: Mode) {
    this.dataService.changeMode(mode)
  }
    protected readonly ModeType = ModeType;

  showSub() {
    this._showSub = !this._showSub
  }
}

export enum ModeType {
  Boxplot = "Boxplot",
  Delta = "Delta",
  Positions = "Positions"
}

export class Mode {

  mode: ModeType
  label: string

  constructor(mode: ModeType) {
    this.mode = mode
    this.label = mode.toString()
  }
}
