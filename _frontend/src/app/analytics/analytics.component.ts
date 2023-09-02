import { Component } from '@angular/core';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent {
  title = "angular-app";
  show = false;

  showPanel() {
    this.show = !this.show
  }
}
