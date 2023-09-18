import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../../_services/data.service";
import {BoxplotProperties, Option_BP} from "../diagram/boxplot/boxplot.component";
import {Subscription} from "rxjs";
import {LocalStorageItem, LocalstorageService} from "../../_services/localstorage.service";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy{

  @ViewChild('errorTag') errorTag: ElementRef<HTMLDivElement>
  private subscription: Subscription;
  bpprop: BoxplotProperties
  options: Option_BP
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

  constructor(public dataService: DataService, private localstorageService: LocalstorageService) {
  }

  ngOnInit() {
    try {
      this.bpprop = this.localstorageService.load("")
    } catch (e) {
      this.bpprop = BoxplotProperties.getInstance()
    }
    this.options = this.initOptions()
    this.subscription = this.dataService.mode.subscribe(mode => this.selectedMode = mode)
    this.loadOptionsFromBprop()
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  showMenu() {
    this._showMenu = !this._showMenu
  }

  onOptionsChange(master: string, value: boolean, type: string) {
    if (type == "opt_bp") {
      this.setProperties(master, value)
      this.localstorageService.save("bpprop",this.bpprop)
      this.dataService.changeBpprop(this.bpprop)
    }
  }

  onSubOptionsChange(master: string, sub: string, value: boolean, type: string) {
    if (type == "opt_bp") {
      this.setSubProperties(master, sub, value)
      this.localstorageService.save("bpprop",this.bpprop)
      this.dataService.changeBpprop(this.bpprop)
    }
  }

  private setProperties(optKey: string, value: boolean) {
    for (let bpKey in this.bpprop.options) {
      if (bpKey == optKey) {
        this.bpprop.options[bpKey].checked = value
      }
    }
  }

  private setSubProperties(masterKey:  string, subKey: string, value: boolean) {
    for (let firstKey in this.bpprop.options) {
      if (firstKey == masterKey) {
        for (let secondkey in this.bpprop.options[firstKey].suboptions) {
          if (secondkey == subKey) {
            this.bpprop.options[firstKey].suboptions![secondkey].checked = value
          }
        }
      }
    }
  }


  private loadOptionsFromBprop() {

    for (let optKey in this.options) {
      for (let bpropKey in this.bpprop.options) {
        if (optKey == bpropKey) {
          this.options[optKey].checked = this.bpprop.options[bpropKey].checked
        }
      }
    }
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
