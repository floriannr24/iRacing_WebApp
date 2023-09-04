import {Component, ElementRef, ViewChild} from '@angular/core';
import {SubsessionProviderService} from "../../_services/subsession-provider.service";
import {BoxplotProperties, Option_BP} from "../diagram/boxplot/boxplot.component";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

  @ViewChild('errorTag') errorTag: ElementRef<HTMLDivElement>
  bpprop: BoxplotProperties
  options: Option_BP
  selectedMode: Mode = {mode: ModeType.Boxplot, label: "Boxplot"}
  showError: boolean = false
  errorTag_text: string
  show: boolean = false
  modes: Mode[] = [
      {mode: ModeType.Boxplot, label: "Boxplot"},
      {mode: ModeType.Delta, label: "Delta"},
      {mode: ModeType.Positions, label: "Positions"}
  ]

  constructor(public sps: SubsessionProviderService) {
  }

  ngOnInit() {
    try {
      this.bpprop = this.sps.loadFromCache("bpprop")
    } catch (e) {
      this.bpprop = BoxplotProperties.getInstance()
    }
    this.options = this.initOptions()
    this.loadOptionsFromBprop()

  }

  showMenu() {
    this.show = !this.show
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

  showErrorTag(text: string) {

  }

  selectMode(value: any) {
    this.selectedMode = value
  }

    protected readonly ModeType = ModeType;
}

type Mode = {
  mode: ModeType,
  label: string
}

enum ModeType {
  Boxplot,
  Delta,
  Positions
}
