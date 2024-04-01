import {Component, EventEmitter, OnInit, Output, signal} from '@angular/core';
import {lastValueFrom} from 'rxjs';
import {DataService} from "../../_services/data.service";
import {APIService, Event} from "../../_services/api.service";
import {LocalstorageService} from "../../_services/localstorage.service";


@Component({
  selector: 'app-race-selector-panel',
  templateUrl: './race-selector-panel.component.html',
  styleUrls: ['./race-selector-panel.component.scss']
})

// todo: convert gmt to corresponding timezone

export class RaceSelectorPanelComponent implements OnInit {
  @Output() closePanelEvent = new EventEmitter<any>()
  @Output() errorTag = new EventEmitter<string>()
  data: Event[]
  selectedRow: Event
  _showValidationError: boolean
  loadingRaceListInProgress: boolean = false
  error_text: String
  selectedRowIndex = -1

  constructor(private localstorageService: LocalstorageService, private dataService: DataService, private apiService: APIService) {
  }

  ngOnInit() {
    this.initDataTable()
    this.initActiveSubsession()
  }

  confirm(radio_table: any, radio_text: any, input_text: any) {

    this._showValidationError = false;

    if (radio_table.checked) {
      if (this.noRowSelected()) {
        this.showError("No session has been selected in the table")
      } else {
        try {
          this.dataService.loadingAnalyticsDataInProgress.set(true)
          this.sendToSubsessionService(this.selectedRow)
          this.localstorageService.save("subsessionInfo", this.selectedRow)
          this.fetchData_boxplot(this.dataService.subsessionInfo.subsession_id)
        } catch (e) {
          this.sendToSubsessionService(new Event())
          this.dataService.changeSubsession(this.dataService.createEmptyAnalyticsData())
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
    this._showValidationError = true
    this.error_text = text
  }

  async refreshTable() {
    this.loadingRaceListInProgress = true
    this.data = await this.fetchData_recentRaces()
    this.loadingRaceListInProgress = false
    this.convertToTimezone(this.data)
    this.localstorageService.save("recentRaces", this.data)
  }

  private sendToSubsessionService(subsession: Event) {
    this.dataService.subsessionInfo = subsession
  }

  private initActiveSubsession() {
    if (this.dataService.subsessionInfo && this.dataService.subsessionInfo.subsession_id) {
      this.selectedRowIndex = this.dataService.subsessionInfo.subsession_id
      this.selectedRow = this.dataService.subsessionInfo
    }
  }

  async initDataTable() {
    try {
      this.data = this.localstorageService.load("recentRaces")
    } catch (e) {
      this.data = await this.fetchData_recentRaces()
      this.convertToTimezone(this.data)
      this.localstorageService.save("recentRaces", this.data)
    }
  }

  private async fetchData_recentRaces() {
    return await lastValueFrom(this.apiService.getRecentRaces());
  }

  private async fetchData_boxplot(subsession: number | null) {
    if (subsession) {
      let data = await lastValueFrom(this.apiService.getBoxplotData(subsession))
      this.dataService.changeSubsession(data)
      this.localstorageService.save("analyticsData", data)
      this.dataService.loadingAnalyticsDataInProgress.set(false)
    }
  }

  private showErrorTag(text: string) {
    this.error_text = text
    this.errorTag.emit(text)
  }

  private async fetchData_subsessionInfo(input_text: any) {
    if (input_text) {
      var data = await lastValueFrom(this.apiService.getSubsessionInfo(input_text))
      this.dataService.subsessionInfo = data
      this.localstorageService.save("subsessionInfo", data)
    }

  }

  private convertToTimezone(data: Event[]) {
    data.forEach(session => {
      let dateAndTime = session.session_start_time.replace(/T|:00Z/g, ' ')
      let dateObjectAsLocalTime = this.convertToDatetime(dateAndTime)
      session.session_start_time = dateObjectAsLocalTime

    })

  }

  convertToDatetime(dateAndTime: string): string {

    try {
      const [dateString, timeString] = dateAndTime.split(" ");
      const [yearStr, monthStr, dayStr] = dateString.split("-")
      const [hourStr, minuteStr] = timeString.split(":")

      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // Months are zero-indexed in JS
      const day = parseInt(dayStr, 10);
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      const dateObj = new Date(Date.UTC(year, month, day, hour, minute))

      console.log(dateObj)

      // return date in format "YYYY-MM-DD hh:mm"
      return `${dateObj.getFullYear().toString()}-${(dateObj.getMonth()+1).toString().padStart(2,"0")}-${dateObj.getDate().toString().padStart(2,"0")}
      ${dateObj.getHours().toString().padStart(2,"0")}:${dateObj.getMinutes().toString()}`
    } catch (error) {
      return "errorDateConversion";
    }
  }

}

