import {Component, OnInit} from '@angular/core';
import {DataService} from "../_services/data.service";
import {Account} from "../settings/settings.component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {log} from "@angular-devkit/build-angular/src/builders/ssr-dev-server";

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent {
  title = "angular-app";
  _showRaceSelectorPanel = false
  mainAccount: Account | undefined

  constructor(private dataService: DataService) {
    this.dataService.mainAcc.pipe(takeUntilDestroyed()).subscribe(acc => this.mainAccount = acc)
  }

  showRaceSelectorPanel() {
    this._showRaceSelectorPanel = !this._showRaceSelectorPanel
  }
}
