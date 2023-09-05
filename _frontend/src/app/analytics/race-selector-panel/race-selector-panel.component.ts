import {Component, EventEmitter, Output} from '@angular/core';
import {lastValueFrom} from 'rxjs';
import {SubsessionProviderService} from "../../_services/subsession-provider.service";
import {APIService, Event} from "../../_services/api.service";


@Component({
  selector: 'app-race-selector-panel',
  templateUrl: './race-selector-panel.component.html',
  styleUrls: ['./race-selector-panel.component.scss']
})

// todo: convert gmt to corresponding timezone

export class RaceSelectorPanelComponent {
  @Output() closePanelEvent = new EventEmitter<any>()
  @Output() errorTag = new EventEmitter<string>()
  data: Event[]
  selectedRow: Event
  validationError: boolean
  error_text: String
  selectedRowIndex = -1

  constructor(private sps: SubsessionProviderService, private apis: APIService) {
  }

  ngOnInit() {
    this.initDataTable()
    this.initActiveSubsession()
  }

  confirm(radio_table: any, radio_text: any, input_text: any) {

    this.validationError = false;

    if (radio_table.checked) {
      if (this.noRowSelected()) {
        this.showError("No session has been selected in the table")
      } else {
        try {
          this.sendToSubsessionService(this.selectedRow)
          this.sps.saveToCache("activeSubsession", this.selectedRow)
          this.fetchData_boxplot(this.sps.activeSubsession.subsession_id)
        } catch (e) {
          this.sendToSubsessionService(this.sps.createEmptySubsession())
          this.sps.changeSubsession(this.sps.createEmptyAnalyticsData())
          this.showErrorTag("Unable to fetch data from iRacing-Server")
        }
        this.closePanel()
      }

    } else if (radio_text.checked) {
      if (this.inputIsEmpty(input_text)) {
        this.showError("Subsession ID is missing")
      } else if (this.inputContainsLetters(input_text)) {
        this.showError("Subsession ID may only contain numeric values!")
      } else {
        try {
          this.fetchData_subsessionInfo(input_text)
          this.fetchData_boxplot(input_text)
        } catch (e) {
          this.showErrorTag("Data for subsession \"" + input_text + "\" does not exist (yet)")
        }
        this.closePanel()
      }

      //no radio button selected
    } else {
      this.showError("No option has been selected")
    }
  }

  selectRow(row: any) {
    this.selectedRow = row
    this.selectedRowIndex = row.subsession_id
  }

  private noRowSelected() {
    return !this.selectedRow;
  }

  private closePanel() {
    this.closePanelEvent.emit()
  }

  private inputContainsLetters(text: any) {
    var hasLetters = /\D/
    return hasLetters.test(text)
  }

  private inputIsEmpty(text: any) {
    return !text;
  }

  private showError(text: String) {
    this.validationError = true
    this.error_text = text

  }

  async refreshTable() {
    this.data = await this.fetchData_recentRaces()
    this.convertToTimezone(this.data)
    this.sps.saveToCache("recentRaces", this.data)
  }

  private sendToSubsessionService(subsession: Event) {
    this.sps.activeSubsession = subsession
  }

  private initActiveSubsession() {
    if (this.sps.activeSubsession && this.sps.activeSubsession.subsession_id) {
      this.selectedRowIndex = this.sps.activeSubsession.subsession_id
      this.selectedRow = this.sps.activeSubsession
    }
  }

  async initDataTable() {
    try {
      this.data = this.sps.loadFromCache("recentRaces")
    } catch (e) {
      this.data = await this.fetchData_recentRaces()
      this.convertToTimezone(this.data)
      this.sps.saveToCache("recentRaces", this.data)
    }
  }

  private async fetchData_recentRaces() {
    return await lastValueFrom(this.apis.getRecentRaces());
  }

  private async fetchData_boxplot(subsession: number | null) {
    if (subsession) {
      var data = await lastValueFrom(this.apis.getBoxplotData(subsession))
      this.sps.changeSubsession(data)
      this.sps.saveToCache("analyticsData", data)
    }
  }

  private showErrorTag(text: string) {
    this.error_text = text
    this.errorTag.emit(text)
  }

  private async fetchData_subsessionInfo(input_text: any) {
    if (input_text) {
      var data = await lastValueFrom(this.apis.getSubsessionInfo(input_text))
      this.sps.activeSubsession = data
      this.sps.saveToCache("activeSubsession", data)
    }

  }

  private convertToTimezone(data: Event[]) {
      data.forEach(session => {
        session.session_start_time = session.session_start_time.replace(/T|:00Z/g, ' ')
      })

  }
}

