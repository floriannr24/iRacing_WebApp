import { Component } from '@angular/core';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent {
  title = "angular-app";
  _showRaceSelectorPanel = false;

  showRaceSelectorPanel() {
    this._showRaceSelectorPanel = !this._showRaceSelectorPanel
  }
}
