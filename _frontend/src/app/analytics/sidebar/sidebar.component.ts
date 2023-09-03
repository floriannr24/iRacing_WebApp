import {Component, ElementRef, ViewChild} from '@angular/core';
import {SubsessionProviderService} from "../../_services/subsession-provider.service";
import {APIService} from "../../_services/api.service";
import {BoxplotProperties, Option_BP} from "../boxplot/boxplot.component";
import {Event} from "@angular/router";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

  @ViewChild('errorTag') errorTag: ElementRef<HTMLDivElement>
  bpprop: BoxplotProperties
  options: Option_BP
  modes: Mode
  currentMode: string = "Boxplot"
  showError: boolean = false
  errorTag_text: string

  constructor(public sps: SubsessionProviderService, private apis: APIService) {
  }

  ngOnInit() {
    this.modes = this.initModes()
    try {
      this.bpprop = this.sps.loadFromCache("bpprop")
    } catch (e) {
      this.bpprop = BoxplotProperties.getInstance()
    }
    this.options = this.initOptions()
    this.loadOptionsFromBprop()

  }

  ngAfterViewInit() {
    this.modes['boxplot'].selected = true
  }

  onModeChange(value: string) {

    for (let modeKey in this.modes) {
      this.modes[modeKey].selected = false
    }

    this.currentMode = value

    switch (value) {
      case "Boxplot":
        this.modes['boxplot'].selected = true
        this.sps.saveToCache("mode", value)
        break
      case "Median-To-First":
        this.modes['medianToFirst'].selected = true
        break
      case "Delta":
        this.modes['delta'].selected = true
        break
    }
  }

  onOptionsChange(id: string, value: boolean, type: string) {
    if (type == "opt_bp") {
      this.setBoxplotProperties(id, value)
      this.sps.saveToCache("bpprop",this.bpprop)
      this.sps.changeActiveBpprop(this.bpprop)
    }
  }

  private setBoxplotProperties(optKey: string, value: boolean) {
    for (let bpKey in this.bpprop.options) {
      if (bpKey == optKey) {
        this.bpprop.options[bpKey].checked = value
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

  private initModes() {
    return {
      boxplot: {label: "Boxplot", selected: false},
      medianToFirst: {label: "Median-To-First", selected: false},
      delta: {label: "Delta", selected: false}
    }
  }

  showErrorTag(text: string) {

  }
}

interface Mode {
  [type: string]: {label: string, selected: boolean}
}


